## Trueque — Pendiente de BD (lo único que falta)

El flujo de Trueque está implementado y funcional **sin BD** (modo dev / in-memory).
Lo que queda pendiente para que Trueque sea persistente con Prisma + PostgreSQL es:

### 1) `DIRECT_URL` debe ser “direct connection” (sin pooler)

En Supabase, `DATABASE_URL` suele apuntar al **pooler** (`*.pooler.supabase.com`).  
Para `prisma migrate dev`, Prisma necesita una conexión directa para la shadow DB.

- Mantén `DATABASE_URL` (runtime) como la del pooler si queréis.
- Cambia `DIRECT_URL` a la **Direct connection string** (host tipo `db.<project>.supabase.co`).

### 2) Ejecutar migración

En `BookMatch-Backend/`:

```bash
npx prisma migrate dev --name add_trades
```

Si vuelve a fallar con shadow DB/permisos, la alternativa es configurar un `SHADOW_DATABASE_URL`
apuntando a una BD/schema permitido para shadow, y reintentar.

### 3) Conectar el service de Trades a Prisma

Una vez aplicada la migración:
- reemplazar el `trades.service.ts` in-memory por queries Prisma sobre `Trade`/`TradeItem`.
- mantener el mismo contrato HTTP ya implementado.

