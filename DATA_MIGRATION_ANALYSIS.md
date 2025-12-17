# 🔄 Documento Técnico: Estrategia de Migración e Ingesta de Datos

## 1. Contexto y Alcance
Este documento detalla el análisis y la metodología seleccionada para poblar la base de datos del proyecto **BookMatch**. El proceso implica una migración de datos desde una fuente externa no relacional (Google Books API) hacia un esquema relacional estructurado (PostgreSQL/Prisma), requiriendo transformación de datos y mapeo de entidades.

---

## 2. Análisis de Métodos de Migración

Para realizar esta carga de datos considerando las diferencias de esquema, se evaluaron las siguientes estrategias:

### Opción A: Importación SQL Directa (Descartada)
* **Descripción:** Uso de archivos `.sql` o `.csv` estáticos.
* **Razón de descarte:** La fuente de datos es dinámica y el esquema de destino requiere integridad referencial compleja (IDs autogenerados, tablas intermedias) que es difícil de gestionar manualmente en CSV.

### Opción B: Script ETL Customizado (Seleccionada) ✅
* **Descripción:** Desarrollo de un script en TypeScript (`seed.ts`) que actúa como proceso ETL (Extract, Transform, Load).
* **Justificación:**
    * Permite la **Transformación** de datos en vuelo (limpieza de strings, generación de precios simulados).
    * Maneja el **Cambio de Esquema** programáticamente (mapeo de objetos JSON anidados a tablas planas).
    * Garantiza la **Integridad Referencial** mediante el ORM Prisma.

---

## 3. Proceso de Migración Paso a Paso

El script de migración (`seed.ts`) ejecuta las siguientes fases secuenciales:

### Fase 1: Extracción (Extract)
Se realizan peticiones HTTP iterativas a la API de Google Books.
* **Estrategia de Paginación:** Iteración por términos de búsqueda predefinidos (categorías) para maximizar la variedad.
* **Filtrado en Origen:** Se solicitan solo campos necesarios (`volumeInfo`, `saleInfo`) para reducir ancho de banda.

### Fase 2: Transformación (Transform) - *Gestión del Cambio de Esquema*
Aquí ocurre la adaptación crítica entre los dos modelos de datos:

| Dato | Esquema Origen (Google JSON) | Esquema Destino (Prisma PostgreSQL) | Transformación Aplicada |
| :--- | :--- | :--- | :--- |
| **ID** | `id` (String alfanumérico) | `id` (Int Autoincrement) | Se ignora el ID de Google; Postgres genera uno nuevo. |
| **Identificador** | `industryIdentifiers` (Array) | `isbn` (String @unique) | Se busca y extrae específicamente el ISBN-13 o ISBN-10. |
| **Autor** | `authors` (Array de Strings) | `author` (String) | `join(', ')` para convertir array a string único. |
| **Imagen** | `imageLinks.thumbnail` (HTTP) | `coverUrl` (HTTPS) | Reemplazo de protocolo para seguridad mixta. |
| **Precio** | `saleInfo.listPrice` (Opcional) | `price` (Decimal, Obligatorio) | Si es `null`, se inyecta un valor aleatorio (Mocking) para viabilidad comercial. |

### Fase 3: Carga (Load)
Uso de operaciones `upsert` (Update or Insert) de Prisma.
1.  **Sincronización de Tablas Maestras:** Se aseguran las categorías con IDs fijos.
2.  **Persistencia Transaccional:** Se guarda el libro y, en la misma transacción lógica, se crea el registro en la tabla pivote `CatalogBookCategory`.

---

## 4. Riesgos, Dependencias y Mitigación

| Tipo | Descripción | Nivel | Estrategia de Mitigación / Recomendación |
| :--- | :--- | :--- | :--- |
| **Dependencia** | **Google Books API Availability** | Alto | El script depende de que la API esté online y la Key sea válida. |
| **Dependencia** | **API Rate Limiting** | Medio | Google limita las peticiones por minuto. **Solución:** Se implementó un `setTimeout` (delay) de 800ms entre iteraciones. |
| **Riesgo** | **Datos Incompletos (Dirty Data)** | Medio | Algunos libros no tienen ISBN o autor. **Solución:** El script filtra y descarta registros que no cumplan con las restricciones `NOT NULL` de la BD. |
| **Riesgo** | **Duplicidad de Datos** | Bajo | Un libro puede aparecer en dos categorías. **Solución:** Uso de `Prisma.upsert()` basado en el campo único `isbn`. |

---

## 5. Validación de la Migración

Para confirmar que la migración ha sido exitosa, se deben ejecutar las siguientes verificaciones post-migración:

### A. Validación Cuantitativa (Conteo)
Ejecutar en `Prisma Studio` o cliente SQL:
```sql
-- Debe devolver ~1000 registros
SELECT COUNT(*) FROM catalog_books;

-- Debe devolver > 1000 registros (un libro puede tener varias categorías)
SELECT COUNT(*) FROM catalog_book_categories;