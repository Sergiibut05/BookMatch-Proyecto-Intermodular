# Seeding / ingesta

**Estado:** Implementado | **Stack:** TypeScript, Prisma, Google Books API, Cloudinary (opcional en seed)

## 1\. Resumen

El poblado del catálogo usa `BookMatch-Backend/prisma/seed.ts`: llama a **Google Books API**, normaliza datos y escribe en PostgreSQL con Prisma (`upsert` por ISBN donde aplica). Los precios y parte del stock se **simulan** porque la API no es un catálogo comercial.

## 2\. Entorno al ejecutar el script

Además de `DATABASE_URL` / `DIRECT_URL` válidos:

* `GOOGLE_BOOKS_API_KEY` — obligatoria para las descargas masivas.
* `CLOUDINARY_*` — opcional; si falta, el seed puede limitar la subida de portadas (según la lógica actual del script).

Comando habitual:

<!\[CDATA\[cd BookMatch-Backend npx tsx prisma/seed.ts\]\]>

## 3\. Características técnicas

* **Rate limiting:** pausas entre llamadas a Google (p. ej. \~800 ms) para reducir errores por cuota.
* **Idempotencia:** uso de `upsert` y claves como ISBN para no duplicar libros al relanzar.
* **Higiene:** descarte de registros sin datos mínimos (título, autor, imagen, etc., según implementación).
* **Datos comerciales:** precios en rango simulado y stock aleatorio para poder probar carrito y pagos.

## 4\. Mapeo datos (ejemplos)

| Origen (Google Books) | Destino (Prisma) | Notas                    |
| --------------------- | ---------------- | ------------------------ |
| industryIdentifiers   | isbn             | Preferencia ISBN-13 / 10 |
| authors\[\]           | author           | Texto único (join)       |
| URL http de imagen    | coverUrl https   | Evitar mixed content     |
| —                     | price, stock     | Generados en el seed     |

## 5\. Categoría "Novedades"

Documentado en versiones anteriores del guion: categoría especial (p. ej. id **47** en datos sembrados) que enlaza un subconjunto de libros recientes tras la carga — **validar** en `seed.ts` y en la tabla `categories` tras ejecutar, por si el id cambia entre entornos.

---

**Actualización:** abril 2026 — variables de entorno y comando; matiz sobre id de Novedades.