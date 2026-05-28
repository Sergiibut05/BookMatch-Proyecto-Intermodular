# Guía n8n — BookMatch AI Agent v2

> **Versión actual: v2 (AI Agent con OpenRouter).**
> Los workflows anteriores basados en Groq + cadena SQL han sido reemplazados.
> Ver sección [Migración desde v1](#migración-desde-v1) si necesitas revertir.

---

## Arquitectura general

```
Angular → Backend → n8n Webhook
                         │
                    Normalizar Payload
                         │
                    AI Agent (Gemini 2.5 Flash via OpenRouter)
                    ├── Postgres Chat Memory (sessionKey = conversationId)
                    └── Tools:
                        ├── get_categories
                        ├── search_catalog_books
                        ├── get_book_details
                        ├── get_user_taste
                        ├── search_external_books  ← OL → Google Books
                        └── add_books_to_catalog   ← INSERT con portada validada
                         │
                    Procesar JSON (backstop determinista)
                         │
                    PATCH Firestore (mensaje + título)
```

### Archivos del repo

| Archivo | Descripción |
|---|---|
| `BookMatch-Angular/n8n/workflows/Update Firestore Message.json` | Workflow principal del chat v2 |
| `BookMatch-Angular/n8n/workflows/Generate Playlist.json` | Workflow generación playlist v2 |
| `BookMatch-Angular/n8n/workflows/tools/tool-search-catalog-books.json` | Subworkflow T1 |
| `BookMatch-Angular/n8n/workflows/tools/tool-get-book-details.json` | Subworkflow T2 |
| `BookMatch-Angular/n8n/workflows/tools/tool-get-user-taste.json` | Subworkflow T3 |
| `BookMatch-Angular/n8n/workflows/tools/tool-search-external-books.json` | Subworkflow T4 |
| `BookMatch-Angular/n8n/workflows/tools/tool-add-books-to-catalog.json` | Subworkflow T5 |
| `BookMatch-Angular/n8n/workflows/tools/tool-get-categories.json` | Subworkflow T6 |

---

## Setup en n8n

### 1. Credenciales necesarias

| Credencial n8n | Tipo | Dónde se usa |
|---|---|---|
| `OpenRouter account` | OpenRouter API | Nodo LM Chat OpenRouter en ambos workflows |
| `Postgres account` (ID `zeU51y9XScYtwY9X`) | PostgreSQL | Todos los tools + Postgres Chat Memory |
| `Google Service Account account` (ID `6A1fVpwq2hUGNQh4`) | Google API | PATCH Firestore |

**OpenRouter:** Crea una cuenta en [openrouter.ai](https://openrouter.ai) → API Keys → copia la clave.
En n8n: Credentials → New → OpenRouter → pega la API key.

### 2. Importar workflows en n8n

**Orden de importación (los tools primero porque los workflows principales los referencian):**

1. Importar los 6 tools (en cualquier orden):
   - `tool-get-categories.json`
   - `tool-search-catalog-books.json`
   - `tool-get-book-details.json`
   - `tool-get-user-taste.json`
   - `tool-search-external-books.json`
   - `tool-add-books-to-catalog.json`

2. Anotar el **ID** de cada workflow tool importado (visible en la URL de n8n: `/workflow/XXXX`).

3. Importar `Update Firestore Message.json` y `Generate Playlist.json`.

4. En ambos workflows principales, abrir cada nodo **Tool: \*** y en el campo **Workflow** seleccionar el subworkflow correspondiente por su ID (o buscar por nombre).

### 3. Actualizar IDs en los Tool nodes

Los JSON del repo tienen placeholders (`TOOL_SEARCH_CATALOG_ID`, etc.) que debes reemplazar con los IDs reales tras la importación:

| Placeholder | Workflow tool importado |
|---|---|
| `TOOL_SEARCH_CATALOG_ID` | Tool · search_catalog_books |
| `TOOL_GET_BOOK_ID` | Tool · get_book_details |
| `TOOL_USER_TASTE_ID` | Tool · get_user_taste |
| `TOOL_SEARCH_EXTERNAL_ID` | Tool · search_external_books |
| `TOOL_ADD_BOOKS_ID` | Tool · add_books_to_catalog |
| `TOOL_CATEGORIES_ID` | Tool · get_categories |
| `OPENROUTER_CREDENTIAL_ID` | ID de tu credencial OpenRouter en n8n |

### 4. Variables de entorno n8n (opcionales)

Si quieres cambiar el modelo sin editar el JSON:

```bash
# En el .env del contenedor Docker de n8n:
OPENROUTER_CHAT_MODEL=google/gemini-2.5-flash
OPENROUTER_FALLBACK_MODEL=google/gemini-2.5-flash-lite
```

El nodo LM Chat ya tiene `google/gemini-2.5-flash` hardcodeado como default. Puedes cambiarlo directamente en el nodo si prefieres.

### 5. Activar workflows

- Importar en estado **inactivo**.
- Probar con el webhook de prueba desde n8n.
- Activar cuando las pruebas sean satisfactorias.
- Renombrar los workflows v1 como `_legacy` en n8n antes de desactivarlos.

---

## Modelo de IA

**Principal:** `google/gemini-2.5-flash` via OpenRouter
- Coste aprox: $0.30 / $2.50 por 1M tokens (entrada/salida)
- Excelente tool-calling y seguimiento de instrucciones multi-step
- Soporta `response_format: json_object`

**Alternativa más barata:** `google/gemini-2.5-flash-lite` ($0.10 / $0.40)
- Útil si las pruebas demuestran calidad similar para este caso de uso

**Coste estimado por interacción:** ~$0.001–0.003 (con memoria de 12 mensajes)

---

## Lógica de auto-alta de libros

Cuando el catálogo interno no tiene suficientes libros relevantes:

1. `search_external_books` busca en **Open Library** primero.
   - Valida portadas con HEAD request: `content-type: image/*` + `content-length > 15000`.
   - Fuentes de portada por orden: `covers.openlibrary.org/b/id/{id}-L.jpg` → `olid` → `isbn`.
2. Si OL no da suficientes portadas válidas, cae a **Google Books API**.
   - Reescribe thumbnails a alta resolución: `zoom=0&fife=w800-h1200`.
   - Misma validación HEAD.
3. Si ambas fuentes fallan para un libro → NO se inserta ese libro.
4. `add_books_to_catalog` inserta con `price=9.99`, `stock=5` (TFG/simulación).
5. Los IDs insertados están disponibles inmediatamente para el agente.

---

## Toggle playlist en Angular

El modo playlist se persiste en `localStorage` con clave `bm_chat_playlist_mode`.
Al cambiar de conversación (`selectConversation`) o crear una nueva (`createNewConversation`), se limpia:
- `manualDraftOverride` → null
- `lastDraftMessageId` → null
- `playlistPanelOpen` → false

Esto evita que el borrador de una conversación se "filtre" a otra.

---

## Casos de prueba recomendados

| Caso | Acción | Resultado esperado |
|---|---|---|
| A | Pedir fantasía épica (catálogo suficiente) | Respuesta con 3-5 libros, sin INSERT |
| B | Pedir género muy nicho (< 5 en catálogo) | Auto-alta de 2-3 libros con portada OL/GB |
| C | Modo playlist: "añade 3 thrillers más" sobre draft de 5 | Draft final = 8 libros, los 5 originales intactos |
| D | Toggle OFF con draft vivo | Respuesta chat normal, draft no se destruye |
| E | Cambiar de conversación | Panel cerrado, draft anterior no aparece |

---

## Migración desde v1

Los workflows v1 (Groq + cadena SQL) quedan en el historial de git.
Para revertir:

   ```bash
git log --oneline BookMatch-Angular/n8n/workflows/
git checkout <commit-hash> -- "BookMatch-Angular/n8n/workflows/Update Firestore Message.json"
git checkout <commit-hash> -- "BookMatch-Angular/n8n/workflows/Generate Playlist.json"
```

En n8n: desactivar los workflows v2 y reactivar los `_legacy`.

---

## Troubleshooting

**El agente devuelve IDs que no existen:**
- Verificar que los subworkflows tool están activos en n8n.
- Revisar logs de ejecución del agente → ver qué devuelven los tools.

**Portadas no válidas en auto-alta:**
- El tool `search_external_books` valida con HEAD. Si Open Library o Google Books están caídos, los libros se descartan (no se insertan).
- Normal: el agente responderá con menos libros de los solicitados en ese caso.

**Memoria no funciona (agente no recuerda conversaciones previas):**
- Verificar que `Postgres Chat Memory` tiene la credencial correcta.
- La tabla `n8n_chat_histories` debe existir (n8n la crea automáticamente al primer uso).

**Error 401 en OpenRouter:**
- Verificar que la credencial `OpenRouter account` en n8n tiene la API key correcta.
- Asegurarse de que la cuenta OpenRouter tiene créditos.
