# Base de Datos

### Esquema (Prisma + PostgreSQL)

El esquema vive en `BookMatch-Backend/prisma/schema.prisma`. El datasource declara:

* `url` \= `env("DATABASE_URL")` — conexión habitual (a veces con pooler).
* `directUrl` \= `env("DIRECT_URL")` — conexión directa para migraciones/introspección; en local suele ser **la misma** cadena que `DATABASE_URL`.

### Documentación relacionada

* **Modelos principales** — resumen de entidades (comprobar siempre el `schema.prisma` por `@map` y campos nuevos).
* **Estrategia de seeding** — Google Books, precios simulados, categoría Novedades.

### Migraciones

Directorio: `BookMatch-Backend/prisma/migrations/`.

<!\[CDATA\[npx prisma migrate dev --name nombre\_migracion npx prisma migrate deploy npx prisma migrate status npx prisma migrate reset # ⚠️ borra datos\]\]>

### Seeding

<!\[CDATA\[npx tsx prisma/seed.ts\]\]>

### Prisma Studio

<!\[CDATA\[npx prisma studio\]\]>

Por defecto `http://localhost:5555`.

---

**Actualización:** abril 2026 — `DIRECT_URL` y enlaces estables a subpáginas.