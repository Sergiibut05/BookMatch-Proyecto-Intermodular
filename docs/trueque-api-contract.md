# Contrato API — Trueque (Trades)

> Objetivo: acordar **estados**, **transiciones**, **endpoints** y **payloads** para implementar el módulo de Trueque de forma consistente entre `BookMatch-Backend/` y `BookMatch-Angular/`.

## 1) Conceptos y entidades

### Entidad principal: `Trade`

Un **trade** representa una propuesta de trueque entre 2 usuarios:

- **sender**: usuario que inicia la propuesta (emisor).
- **receiver**: usuario destinatario (receptor).
- **items**: libros ofrecidos por cada parte (referencian `user_books.id`).

> Nota: en BD existe `user_books` con `owner_id`. Esto permite validar ownership y permisos.

### Items: `TradeItem`

Cada item representa un libro de un usuario en el trade:

- `userBookId`: `UserBook.id` (tabla `user_books`)
- `side`: indica si pertenece al `SENDER` o al `RECEIVER`

## 2) Estados y transiciones

### `TradeStatus`

- `PROPOSED`: propuesta creada, pendiente de respuesta del receptor.
- `ACCEPTED`: receptor aceptó.
- `REJECTED`: receptor rechazó.
- `CANCELLED`: emisor canceló antes de aceptación (o según regla acordada).
- `COMPLETED`: trueque completado (regla simple por ahora).
- `EXPIRED`: caducada por tiempo (si se implementa A6).

### Tabla de transiciones permitidas

| Estado actual | Acción | Quién | Nuevo estado | Notas |
|---|---|---|---|---|
| `PROPOSED` | `accept` | receiver | `ACCEPTED` | Solo receptor |
| `PROPOSED` | `reject` | receiver | `REJECTED` | Solo receptor |
| `PROPOSED` | `cancel` | sender | `CANCELLED` | Solo emisor |
| `ACCEPTED` | `complete` | sender o receiver | `COMPLETED` | Regla simple: cualquiera de los 2 puede completar |
| `PROPOSED` | `expire` | system/job | `EXPIRED` | Automático (A6) |

**Regla de oro**: transiciones inválidas deben devolver **409 Conflict** (sin efectos laterales).

## 3) Permisos (autorización)

### Regla base

- Un usuario solo puede **ver** trades donde sea `sender` o `receiver`.
- Un usuario solo puede **actuar** según rol y estado (tabla de transiciones).

### Validaciones de negocio mínimas

- `POST /trades`: los `offeredUserBookIds` **deben pertenecer** al `sender`.
- (Opcional) `requestedUserBookIds` deben pertenecer al `receiver` (si se usa ese modelo).
- No permitir que `senderId === receiverId` (409 o 400).
- Evitar duplicados “activos” (mismo sender/receiver + mismos items + estado no final) → **409**.

## 4) Endpoints (v1)

> Base sugerida: `/api/trades` (ajustar al prefijo real del backend).

### 4.1 Crear propuesta

`POST /api/trades`

**Request**

```json
{
  "receiverUserId": 123,
  "offeredUserBookIds": [10, 11],
  "requestedUserBookIds": [55]
}
```

**Notas**

- `requestedUserBookIds` puede ser `[]` si el producto decide “solo ofrezco y el otro responde con contraoferta” (si se elige ese flujo, ajustar contrato y UI).

**Response 201**

```json
{
  "trade": {
    "id": 999,
    "status": "PROPOSED",
    "sender": { "id": 1, "fullName": "..." , "avatarUrl": "..." },
    "receiver": { "id": 123, "fullName": "..." , "avatarUrl": "..." },
    "items": [
      {
        "id": 1,
        "side": "SENDER",
        "userBook": { "id": 10, "title": "...", "author": "...", "coverUrl": "..." }
      },
      {
        "id": 2,
        "side": "RECEIVER",
        "userBook": { "id": 55, "title": "...", "author": "...", "coverUrl": "..." }
      }
    ],
    "createdAt": "2026-04-23T12:34:56.000Z",
    "updatedAt": "2026-04-23T12:34:56.000Z"
  }
}
```

**Errores**

- `400`: payload inválido (Zod).
- `401`: no autenticado.
- `403`: el usuario intenta ofrecer `userBookId` que no es suyo.
- `404`: receiver o userBooks no existen.
- `409`: propuesta duplicada o reglas de negocio (p.ej. sender=receiver).

### 4.2 Listado “mis trades”

`GET /api/trades?role=sender|receiver&status=PROPOSED|ACCEPTED|...&page=1&limit=20`

**Response 200**

```json
{
  "items": [
    {
      "id": 999,
      "status": "PROPOSED",
      "sender": { "id": 1, "fullName": "...", "avatarUrl": "..." },
      "receiver": { "id": 123, "fullName": "...", "avatarUrl": "..." },
      "preview": {
        "senderCount": 2,
        "receiverCount": 1,
        "firstCoverUrl": "..."
      },
      "createdAt": "2026-04-23T12:34:56.000Z",
      "updatedAt": "2026-04-23T12:34:56.000Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 1
}
```

**Errores**

- `401`: no autenticado.
- `400`: query params inválidos.

### 4.3 Detalle

`GET /api/trades/:id`

**Response 200**

Igual que `trade` en el `POST`, incluyendo items completos.

**Errores**

- `401`: no autenticado.
- `403`: trade ajeno.
- `404`: no existe.

### 4.4 Acciones (transiciones)

`POST /api/trades/:id/accept`  
`POST /api/trades/:id/reject`  
`POST /api/trades/:id/cancel`  
`POST /api/trades/:id/complete`

**Request**: vacío (por defecto)

**Response 200**

```json
{
  "trade": {
    "id": 999,
    "status": "ACCEPTED",
    "updatedAt": "2026-04-23T13:00:00.000Z"
  }
}
```

**Errores**

- `401`: no autenticado.
- `403`: no participante o sin permisos para la acción.
- `404`: trade no existe.
- `409`: transición inválida según estado actual.

## 5) Estructura de error (propuesta)

Para mantener UX consistente, se recomienda:

```json
{
  "message": "Human readable error",
  "code": "TRADE_INVALID_TRANSITION",
  "details": {
    "status": "REJECTED",
    "action": "accept"
  }
}
```

Para errores de validación (Zod):

```json
{
  "message": "Validation error",
  "code": "VALIDATION_ERROR",
  "errors": {
    "receiverUserId": ["Required"],
    "offeredUserBookIds": ["Must contain at least 1 item"]
  }
}
```

## 6) Campos mínimos para UI (mobile-first)

Para que el frontend pueda reproducir la UI estilo “cards” (como el mock móvil):

- Listado:
  - `trade.id`, `trade.status`, `sender/receiver (nombre + avatar)`
  - preview: `firstCoverUrl` + contadores de items por lado
  - `updatedAt` (ordenación)
- Detalle:
  - `items[]` con `userBook.title/author/coverUrl`
  - acciones disponibles según rol/estado (puede derivarse en frontend, pero ideal incluir `availableActions` en respuesta si se prefiere)

## 7) Pendientes a decidir (antes de A2/A3)

- Si `requestedUserBookIds` es obligatorio o opcional (impacta UI/flujo).
- Regla de `COMPLETED`: simple (cualquiera) vs doble confirmación.
- ¿Se permite `cancel` en `ACCEPTED`? (si sí, definir condición y estado resultante).

