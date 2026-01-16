# Guía Completa del Workflow de n8n para Asistente de Libros

## ℹ️ Información Importante

### Sobre Groq y LLMs

**¿Qué es Groq?**
- Groq es una plataforma de inferencia LLM (Large Language Model) ultra-rápida
- Ofrece acceso a modelos open-source como Llama 3.3, Mixtral, Gemma
- **NO necesitas "agentes de IA"** - es una API REST simple como cualquier otra
- Compatible con el formato de OpenAI (fácil de integrar)

**¿Necesito agentes de IA para usar Groq?**
- **NO**. Groq es simplemente una API HTTP que recibes respuestas JSON
- En n8n, usarás el nodo **HTTP Request** para llamar a Groq
- Es tan simple como hacer un POST a `https://api.groq.com/openai/v1/chat/completions`
- Solo necesitas una API Key gratuita de Groq Console

**Modelos disponibles en Groq**:
- `compound` - ⭐ **RECOMENDADO** - Routing inteligente, contexto muy amplio (~128k tokens)
- `llama-3.3-70b-versatile` - Alternativa rápida y precisa
- `llama-3.1-70b-versatile` - Buena opción general
- `mixtral-8x7b-32768` - Bueno para contextos largos
- `gemma2-9b-it` - Más económico en tokens

**¿Qué es el modelo `compound`?**
- Es un meta-modelo que hace routing automático entre varios modelos de Groq
- Elige el mejor modelo para cada tarea (razonamiento, código, creatividad)
- Contexto muy amplio (ideal para conversaciones largas)
- **NO tiene "tokens infinitos"** pero tiene límite muy alto (~128k tokens)
- Perfecto para generar thoughts reales y razonamiento complejo

**Prueba rápida de Groq (antes de configurar n8n)**:

Puedes probar Groq desde tu terminal para verificar que tu API Key funciona:

```bash
curl -X POST "https://api.groq.com/openai/v1/chat/completions" \
  -H "Authorization: Bearer TU_GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "compound",
    "messages": [
      {
        "role": "user",
        "content": "Hola, esto es una prueba"
      }
    ]
  }'
```

Si funciona, verás una respuesta JSON con `choices[0].message.content`.

### Generando Thoughts Reales (sin agentes de IA)

**¿Necesito agentes de IA para obtener thoughts reales?**
- **NO**. Solo necesitas usar **structured output** en tus prompts
- Pides al LLM que devuelva JSON con campos separados: `thoughts` y `response`
- El modelo compound es especialmente bueno para esto (mejor razonamiento)

**Ejemplo de structured output**:

```json
{
  "model": "compound",
  "messages": [
    {
      "role": "user",
      "content": "Responde en formato JSON con esta estructura:\n{\n  \"thoughts\": [\"paso 1\", \"paso 2\", \"paso 3\"],\n  \"response\": \"tu respuesta final\"\n}\n\nPregunta: ¿Qué libros de fantasía me recomiendas?"
    }
  ],
  "response_format": { "type": "json_object" }
}
```

**Resultado esperado**:
```json
{
  "thoughts": [
    "El usuario busca libros de fantasía",
    "Necesito consultar la base de datos",
    "Filtrar por categoría fantasía y excluir ya leídos"
  ],
  "response": "Te recomiendo El Nombre del Viento..."
}
```

**Ventajas de usar `compound` para thoughts**:
- Mejor razonamiento paso a paso (Chain of Thought)
- Contexto amplio (puede considerar toda la conversación)
- Routing automático al mejor modelo según la tarea
- Ideal para structured output (JSON)

**¿Cuándo usar compound vs otros modelos?**

| Tarea | Modelo Recomendado | Razón |
|-------|-------------------|-------|
| SQL generation | `compound` | Mejor razonamiento lógico |
| Book recommendations | `compound` | Análisis complejo + contexto |
| Casual chat | `llama-3.3-70b-versatile` | Más rápido, suficiente para saludos |
| Structured output | `compound` | Mejor adherencia a formato JSON |

**Nota sobre velocidad**:
- `compound`: ~2-5 segundos por respuesta (más lento)
- `llama-3.3-70b-versatile`: ~0.5-1 segundo (muy rápido)
- El tradeoff: compound = mejor calidad, llama = mayor velocidad

### Requisitos previos

- Cuenta en n8n (puede ser cloud o self-hosted)
- API Key de Groq (gratis en https://console.groq.com)
- Firebase Service Account con acceso a Firestore
- Acceso a PostgreSQL (tu base de datos de libros)

---

## Tabla de Contenidos
1. [Arquitectura General](#arquitectura-general)
2. [Nodos del Workflow](#nodos-del-workflow)
3. [Prompts Detallados](#prompts-detallados)
4. [Configuración Paso a Paso](#configuración-paso-a-paso)
5. [Testing y Debugging](#testing-y-debugging)

## Arquitectura General

```
Webhook → Intent Detection → Branch (IF)
                                ├─→ Path A: Book Recommendation
                                │   └─→ Load Context → Generate SQL → Execute → Generate Response → Update Firestore
                                ├─→ Path B: Casual Chat  
                                │   └─→ Simple LLM Response → Update Firestore
                                └─→ Path C: Out of Scope
                                    └─→ Decline Response → Update Firestore
```

## Nodos del Workflow

### 1. Webhook Trigger

**Tipo**: Webhook  
**Método**: POST  
**Path**: `/webhook/NUEVO_ID`

**Datos recibidos**:
```json
{
  "userId": "string",
  "conversationId": "string", 
  "messageId": "string",
  "userMessage": "string",
  "baseUrl": "string"
}
```

**Configuración**:
- Authentication: None (o Header Auth si prefieres seguridad adicional)
- Response Mode: Immediately
- Options: 
  - Respond: "allIncomingEvents"
  - Response Code: 200

---

### 2. Intent Detection (Function Node)

**Nombre**: `Detectar Intención`  
**Tipo**: Function

**Código JavaScript**:
```javascript
const userMessage = $json.userMessage.toLowerCase();

let intentType = 'out_of_scope';
let confidence = 0;

// Keywords para book recommendation
const bookKeywords = [
  'libro', 'libros', 'recomienda', 'recomendación', 'leer', 'lectura',
  'autor', 'novela', 'cuento', 'ficción', 'fantasía', 'romance', 
  'ciencia ficción', 'misterio', 'thriller', 'bestseller'
];

// Keywords para casual chat
const casualKeywords = [
  'hola', 'hey', 'buenos días', 'buenas tardes', 'buenas noches',
  'qué tal', 'cómo estás', 'gracias', 'adiós', 'hasta luego'
];

// Check book recommendation
const bookMatches = bookKeywords.filter(keyword => 
  userMessage.includes(keyword)
).length;

// Check casual chat
const casualMatches = casualKeywords.filter(keyword => 
  userMessage.includes(keyword)
).length;

if (bookMatches > 0) {
  intentType = 'book_recommendation';
  confidence = bookMatches / bookKeywords.length;
} else if (casualMatches > 0 || userMessage.length < 20) {
  intentType = 'casual_chat';
  confidence = 0.8;
}

return {
  ...($json),
  intentType,
  confidence
};
```

---

### 3. Branch - IF Node (Intent Check)

**Nombre**: `Switch Intent`  
**Tipo**: Switch

**Condiciones**:

**Route 1** - Book Recommendation:
- **Condition**: `{{ $json.intentType }}` equals `book_recommendation`

**Route 2** - Casual Chat:
- **Condition**: `{{ $json.intentType }}` equals `casual_chat`

**Route 3** - Out of Scope (Fallback):
- Use as default/fallback

---

## Path A: Book Recommendation

### 4A. Load Conversation Context (HTTP Request to Firestore)

**Nombre**: `Cargar Contexto`  
**Tipo**: HTTP Request

**Configuración**:
- Method: GET
- URL: `https://firestore.googleapis.com/v1/projects/bookmatch-522d5/databases/(default)/documents/users/{{ $json.userId }}/conversations/{{ $json.conversationId }}/messages`
- Authentication: Service Account (Firebase)
- Query Parameters:
  - `pageSize`: 10
  - `orderBy`: `timestamp desc`

**Post-Processing (Function Node)**:
```javascript
// Transformar mensajes de Firestore a formato de contexto
const messages = $json.documents || [];
const context = messages
  .reverse() // Orden cronológico
  .map(doc => ({
    role: doc.fields.role.stringValue,
    content: doc.fields.content.stringValue
  }))
  .filter(msg => msg.role === 'user' || msg.role === 'assistant');

return {
  ...($input.item.json),
  conversationContext: context
};
```

---

### 5A. Generate SQL Query (Groq Node)

**Nombre**: `Generar SQL Query`  
**Tipo**: HTTP Request (para llamar a Groq API)

**⚠️ Nota sobre Groq**:
- Groq es una API de inferencia LLM ultra-rápida (no necesitas agentes de IA)
- Soporta modelos como: `llama-3.3-70b-versatile`, `mixtral-8x7b-32768`, `gemma2-9b-it`
- Registro gratuito en: https://console.groq.com
- Obtén tu API Key en: https://console.groq.com/keys

**Configuración HTTP Request**:
- Method: POST
- URL: `https://api.groq.com/openai/v1/chat/completions`
- Authentication: Header Auth
  - Name: `Authorization`
  - Value: `Bearer TU_GROQ_API_KEY`
- Headers:
  - `Content-Type`: `application/json`
- Body (JSON):
```json
{
  "model": "llama-3.3-70b-versatile",
  "temperature": 0.1,
  "max_tokens": 500,
  "messages": [
    {
      "role": "user",
      "content": "PROMPT AQUÍ"
    }
  ]
}
```

**Modelos Recomendados**:
- `llama-3.3-70b-versatile` - Mejor para SQL (más preciso)
- `mixtral-8x7b-32768` - Alternativa rápida
- `gemma2-9b-it` - Más económico

**Configuración completa del Body en n8n**:

En el campo "Body" del HTTP Request node, selecciona "JSON" y pega:

```json
{
  "model": "compound",
  "temperature": 0.1,
  "max_tokens": 800,
  "response_format": { "type": "json_object" },
  "messages": [
    {
      "role": "user",
      "content": "{{ $json.promptContent }}"
    }
  ]
}
```

⚠️ **NOTA**: `response_format: json_object` obliga al modelo a devolver JSON válido

**Construir el Prompt (Function Node previo)**:

Antes del HTTP Request a Groq, añade un Function Node que construya el prompt con structured output:

```javascript
const prompt = `Eres un generador de consultas SQL para PostgreSQL.

RESPONDE EN FORMATO JSON con esta estructura exacta:
{
  "thoughts": [
    "paso 1 de análisis",
    "paso 2 de razonamiento",
    "paso 3 de decisión"
  ],
  "sqlQuery": "SELECT ... FROM ... WHERE ..."
}

REGLAS OBLIGATORIAS:
- SOLO puedes generar consultas SELECT.
- NO puedes usar INSERT, UPDATE, DELETE, DROP.
- Usa JOINs explícitos (NO subqueries correlacionadas innecesarias).
- La query debe excluir libros ya reseñados o comprados por user_id: ${$json.userId}

ESQUEMA DE BASE DE DATOS:

Tabla catalog_books:
- id (PK): integer
- title: text
- author: text
- description: text
- cover_url: text

Tabla categories:
- id (PK): integer
- name: text

Tabla catalog_book_categories:
- catalog_book_id: integer (FK)
- category_id: integer (FK)

Tabla reviews:
- user_id: integer (FK)
- catalog_book_id: integer (FK)

Tabla order_items:
- catalog_book_id: integer (FK)

Tabla orders:
- id: integer
- user_id: integer (FK)

CONTEXTO DE LA CONVERSACIÓN:
${JSON.stringify($json.conversationContext || [])}

MENSAJE DEL USUARIO:
${$json.userMessage}

ANÁLISIS Y GENERA LA QUERY:`;

return {
  ...$json,
  promptContent: prompt
};
```

**Prompt completo**:
```
Eres un generador de consultas SQL para PostgreSQL.

REGLAS OBLIGATORIAS:
- SOLO puedes generar consultas SELECT.
- NO puedes usar INSERT, UPDATE, DELETE, DROP.
- NO puedes modificar datos.
- SOLO puedes consultar las tablas descritas abajo.
- Usa JOINs explícitos (NO subqueries correlacionadas innecesarias).
- DEVUELVE EXCLUSIVAMENTE LA QUERY SQL, sin texto adicional, sin comentarios, sin markdown.

ESQUEMA DE BASE DE DATOS:

Tabla catalog_books:
- id (PK): integer
- title: text
- author: text
- description: text
- created_at: timestamp
- cover_url: text

Tabla categories:
- id (PK): integer
- name: text

Tabla intermedia catalog_book_categories:
- catalog_book_id: integer (FK)
- category_id: integer (FK)

Tabla users:
- id (PK): integer

Tabla reviews:
- id: integer
- user_id: integer (FK)
- catalog_book_id: integer (FK)
- rating: decimal
- comment: text

Tabla orders:
- id: integer
- user_id: integer (FK)

Tabla order_items:
- id: integer
- order_id: integer (FK)
- catalog_book_id: integer (FK)

LÓGICA DE INTERPRETACIÓN:
- Detecta las categorías más relevantes (Fantasía, Romance, Ciencia Ficción, etc.) a partir del mensaje del usuario.
- SIEMPRE considera: excluir libros ya reseñados o ya comprados por el usuario actual (ID: {{ $json.userId }}).
- El resultado puede incluir hasta 30 libros.
- Ordena por relevancia (puedes usar rating promedio si está disponible).

CONTEXTO DE LA CONVERSACIÓN:
{{ $json.conversationContext }}

MENSAJE DEL USUARIO:
{{ $json.userMessage }}

GENERA LA QUERY SQL:
```

**Output**: La query SQL generada

**Post-Processing: Extraer SQL Query y Thoughts (Function Node)**:

⚠️ **IMPORTANTE**: Con structured output, el modelo devuelve JSON con thoughts y query separados:

```javascript
// Extraer respuesta de Groq
const groqResponse = $json.body || $json;
const content = groqResponse.choices[0].message.content.trim();

// Parsear JSON
let parsedResponse;
try {
  parsedResponse = JSON.parse(content);
} catch (error) {
  // Fallback si el modelo no devolvió JSON válido
  console.error('Error parsing JSON:', error);
  parsedResponse = {
    thoughts: ['Error al generar thoughts estructurados'],
    sqlQuery: content // Usar contenido raw como query
  };
}

// Extraer thoughts y query
const thoughts = parsedResponse.thoughts || [];
let sqlQuery = parsedResponse.sqlQuery || parsedResponse.sql_query || '';

// Limpiar query por si acaso
sqlQuery = sqlQuery.trim().replace(/```sql\n?/gi, '').replace(/```\n?/g, '');

// Validación
if (!sqlQuery.toUpperCase().includes('SELECT')) {
  throw new Error('SQL query inválida: no contiene SELECT');
}

return {
  ...($input.item.json),
  sqlQuery: sqlQuery,
  sqlThoughts: thoughts // Guardar thoughts del SQL generation
};
```

---

### 6A. Execute SQL Query (PostgreSQL Node)

**Nombre**: `Ejecutar SQL`  
**Tipo**: PostgreSQL

**Configuración**:
- Operation: Execute Query
- Query: `{{ $json.sqlQuery }}`
- Credentials: Tu conexión PostgreSQL

**Output**: Lista de libros

**Post-Processing (Function Node)**:
```javascript
// Formatear lista de libros
const books = $json.map(book => ({
  id: book.id,
  title: book.title,
  author: book.author,
  description: book.description,
  coverUrl: book.cover_url
}));

return {
  ...($input.item.json),
  listaLibros: JSON.stringify(books, null, 2)
};
```

---

### 7A. Generate AI Response (Groq LLM)

**Nombre**: `Generar Respuesta con Libros`  
**Tipo**: HTTP Request (Groq API)

**Configuración HTTP Request**:
- Method: POST
- URL: `https://api.groq.com/openai/v1/chat/completions`
- Authentication: Header Auth
  - Name: `Authorization`
  - Value: `Bearer TU_GROQ_API_KEY`
- Headers:
  - `Content-Type`: `application/json`
- Body (JSON):
```json
{
  "model": "compound",
  "temperature": 0.7,
  "max_tokens": 2000,
  "response_format": { "type": "json_object" },
  "messages": [
    {
      "role": "system",
      "content": "{{ $json.systemPrompt }}"
    },
    {
      "role": "user",
      "content": "{{ $json.userPrompt }}"
    }
  ]
}
```

**Construir Prompts (Function Node previo)**:

```javascript
const systemPrompt = `Eres un asistente experto en recomendación de libros.

RESPONDE EN FORMATO JSON con esta estructura exacta:
{
  "thoughts": [
    "análisis del mensaje del usuario",
    "criterios de selección",
    "razonamiento de las recomendaciones"
  ],
  "response": "Tu respuesta en formato Markdown",
  "bookIds": [1, 5, 12]
}

FORMATO DE LA RESPUESTA (campo "response"):
- Usa ÚNICAMENTE Markdown (NO HTML).
- Máximo 5 recomendaciones por mensaje.
- Estructura para cada libro:
  **Título** - Autor
  Breve descripción (2-3 líneas)
  [Ver detalles](${$json.baseUrl}/book-details/ID)

LENGUAJE:
- Responde en español (o el idioma del usuario).
- Tono amigable y conciso.
- Usa emojis con moderación (1-2 por respuesta).

ESTRUCTURA:
1. Saludo breve (si es primera interacción)
2. Explicación de por qué elegiste estos libros
3. Lista de 3-5 libros recomendados
4. Pregunta para continuar la conversación`;

const userPrompt = `CONTEXTO DE LA CONVERSACIÓN:
${JSON.stringify($json.conversationContext || [])}

MENSAJE DEL USUARIO:
${$json.userMessage}

LIBROS DISPONIBLES:
${$json.listaLibros}

ANÁLISIS PREVIO (SQL generation thoughts):
${JSON.stringify($json.sqlThoughts || [])}

GENERA TU RESPUESTA:`;

return {
  ...$json,
  systemPrompt,
  userPrompt
};
```

**Post-Processing: Extraer Respuesta y Thoughts Reales (Function Node)**:

**IMPORTANTE**: Después del HTTP Request a Groq, añade un Function Node para extraer el JSON estructurado:

```javascript
// Extraer respuesta de Groq
const groqResponse = $json.body || $json;
const content = groqResponse.choices[0].message.content.trim();

// Parsear JSON estructurado
let parsedResponse;
try {
  parsedResponse = JSON.parse(content);
} catch (error) {
  console.error('Error parsing JSON:', error);
  parsedResponse = {
    thoughts: ['Error al generar thoughts estructurados'],
    response: content, // Usar contenido raw
    bookIds: []
  };
}

// Combinar thoughts del SQL generation con thoughts del response
const allThoughts = [
  ...(($input.item.json.sqlThoughts || []).map(t => `[SQL] ${t}`)),
  ...(parsedResponse.thoughts || []).map(t => `[Response] ${t}`)
];

// Extraer IDs de libros recomendados
const recommendations = (parsedResponse.bookIds || []).map(id => id.toString());

// Si no hay bookIds en el response, intentar extraer de listaLibros
if (recommendations.length === 0) {
  try {
    const books = JSON.parse($input.item.json.listaLibros);
    recommendations.push(...books.slice(0, 5).map(b => b.id.toString()));
  } catch (e) {}
}

return {
  userId: $input.item.json.userId,
  conversationId: $input.item.json.conversationId,
  messageId: $input.item.json.messageId,
  content: parsedResponse.response || content,
  metadata: {
    thoughts: allThoughts,
    recommendations,
    used_querys: [$input.item.json.sqlQuery],
    intentType: 'book_recommendation',
    processingTime: Date.now() - $input.item.json.startTime
  }
};
```

**💡 CLAVE**: Los thoughts ahora son REALES, generados por el modelo compound, no simulados.

**Orden de nodos para Path A (Book Recommendation)**:

```
1. Function: Build SQL Prompt (structured output)
2. HTTP Request: Groq compound (genera thoughts + SQL query)
3. Function: Extract SQL Query + Thoughts
4. PostgreSQL: Execute SQL
5. Function: Format Books
6. Function: Build Response Prompt (structured output)
7. HTTP Request: Groq compound (genera thoughts + response)
8. Function: Extract Response + Combine All Thoughts
9. Merge (unir con otras rutas)
```

**Total de thoughts generados**:
- SQL thoughts: 3-5 pasos de razonamiento
- Response thoughts: 3-5 pasos de razonamiento
- Total combinado: ~6-10 thoughts reales por respuesta

**Ejemplo de respuesta final en Firestore**:

```json
{
  "role": "assistant",
  "content": "📚 Basándome en tu interés por fantasía épica...\n\n**El Nombre del Viento** - Patrick Rothfuss\nUna obra maestra sobre Kvothe, un legendario mago...\n[Ver detalles](/book-details/42)\n\n...",
  "status": "completed",
  "metadata": {
    "thoughts": [
      "[SQL] Usuario busca fantasía épica tipo El Señor de los Anillos",
      "[SQL] Detectadas categorías: Fantasía, Épica, Aventura",
      "[SQL] Filtro aplicado: excluir libros ya comprados (orders) y reseñados (reviews)",
      "[SQL] Ordenar por rating promedio descendente, limitar a 30",
      "[Response] Encontrados 15 libros relevantes en la BD",
      "[Response] Priorizo libros con worldbuilding complejo y personajes profundos",
      "[Response] Selecciono 4 libros: Rothfuss, Sanderson, Abercrombie, Hobb",
      "[Response] Añado pregunta sobre preferencia en sistemas de magia"
    ],
    "recommendations": ["42", "87", "103", "201"],
    "used_querys": ["SELECT cb.id, cb.title, cb.author... FROM catalog_books cb..."],
    "intentType": "book_recommendation",
    "processingTime": 4523
  }
}
```

**Cómo se visualiza en el frontend**:

```html
<details class="thoughts-section">
  <summary>💭 Razonamiento (8 pasos)</summary>
  <ul>
    <li>[SQL] Usuario busca fantasía épica tipo El Señor de los Anillos</li>
    <li>[SQL] Detectadas categorías: Fantasía, Épica, Aventura</li>
    <!-- ... más thoughts ... -->
  </ul>
</details>

<div class="message-content">
  📚 Basándome en tu interés por fantasía épica...
  <!-- contenido markdown renderizado -->
</div>
```

---

## Path B: Casual Chat

### 4B. Simple LLM Response (Groq)

**Nombre**: `Respuesta Casual`  
**Tipo**: HTTP Request (Groq API)

**Configuración HTTP Request**:
- Method: POST
- URL: `https://api.groq.com/openai/v1/chat/completions`
- Authentication: Header Auth
  - Name: `Authorization`
  - Value: `Bearer TU_GROQ_API_KEY`
- Body (JSON):
```json
{
  "model": "compound",
  "temperature": 0.8,
  "max_tokens": 500,
  "response_format": { "type": "json_object" },
  "messages": [
    {
      "role": "system",
      "content": "{{ $json.casualSystemPrompt }}"
    },
    {
      "role": "user",
      "content": "{{ $json.casualUserPrompt }}"
    }
  ]
}
```

**Construir Prompts (Function Node previo)**:

```javascript
const casualSystemPrompt = `Eres un asistente amigable de BookMatch, una plataforma de libros.

RESPONDE EN FORMATO JSON:
{
  "thoughts": ["breve análisis del mensaje"],
  "response": "tu respuesta en texto plano o markdown"
}

Tu personalidad:
- Amigable y cercano
- Breve y directo (máximo 3-4 líneas)
- Intentas llevar la conversación hacia libros
- Responde en español con tono natural`;

const casualUserPrompt = `CONTEXTO:
${JSON.stringify($json.conversationContext || [])}

MENSAJE:
${$json.userMessage}

RESPONDE DE FORMA BREVE Y AMIGABLE:`;

return {
  ...$json,
  casualSystemPrompt,
  casualUserPrompt
};
```

**Post-Processing (Function Node después de Groq)**:

```javascript
// Extraer respuesta JSON
const groqResponse = $json.body || $json;
const content = groqResponse.choices[0].message.content.trim();

let parsedResponse;
try {
  parsedResponse = JSON.parse(content);
} catch (error) {
  parsedResponse = {
    thoughts: ['Respuesta casual simple'],
    response: content
  };
}

return {
  userId: $input.item.json.userId,
  conversationId: $input.item.json.conversationId,
  messageId: $input.item.json.messageId,
  content: parsedResponse.response || content,
  metadata: {
    thoughts: parsedResponse.thoughts || [],
    intentType: 'casual_chat'
  }
};
```

---

## Path C: Out of Scope

### 4C. Decline Response (Set Node)

**Nombre**: `Respuesta Fuera de Alcance`  
**Tipo**: Set

**Configuración**:
Establecer valor fijo:
```json
{
  "content": "Lo siento, soy un asistente especializado en recomendaciones de libros. 📚\n\nPuedo ayudarte a:\n- Encontrar libros según tus gustos\n- Recomendar autores\n- Sugerir lecturas por género\n\n¿Qué tipo de libro te gustaría leer hoy?",
  "metadata": {
    "intentType": "out_of_scope"
  }
}
```

---

## Merge y Update Firestore

### 8. Merge Paths (Merge Node)

**Nombre**: `Unificar Respuestas`  
**Tipo**: Merge

**Configuración**:
- Mode: Merge By Index
- Merge todas las rutas del Switch

---

### 9. Update Firestore Message (HTTP Request)

**Nombre**: `Actualizar Mensaje en Firestore`  
**Tipo**: HTTP Request

**Configuración**:
- Method: PATCH
- URL: `https://firestore.googleapis.com/v1/projects/bookmatch-522d5/databases/(default)/documents/users/{{ $json.userId }}/conversations/{{ $json.conversationId }}/messages/{{ $json.messageId }}?updateMask.fieldPaths=content&updateMask.fieldPaths=status&updateMask.fieldPaths=metadata`
- Authentication: Service Account
- Body (JSON):
```json
{
  "fields": {
    "content": {
      "stringValue": "{{ $json.content }}"
    },
    "status": {
      "stringValue": "completed"
    },
    "metadata": {
      "mapValue": {
        "fields": {
          "thoughts": {
            "arrayValue": {
              "values": {{ JSON.stringify($json.metadata?.thoughts?.map(t => ({ stringValue: t })) || []) }}
            }
          },
          "recommendations": {
            "arrayValue": {
              "values": {{ JSON.stringify($json.metadata?.recommendations?.map(r => ({ stringValue: r })) || []) }}
            }
          },
          "used_querys": {
            "arrayValue": {
              "values": {{ JSON.stringify($json.metadata?.used_querys?.map(q => ({ stringValue: q })) || []) }}
            }
          },
          "intentType": {
            "stringValue": "{{ $json.metadata?.intentType || 'unknown' }}"
          }
        }
      }
    }
  }
}
```

---

### 10. Error Handler (Optional)

**Nombre**: `Manejar Errores`  
**Tipo**: HTTP Request (condicional en caso de error)

Si algún nodo falla, actualizar el mensaje con status: 'error':

```json
{
  "fields": {
    "content": {
      "stringValue": "Lo siento, ocurrió un error al procesar tu solicitud. Por favor, intenta de nuevo."
    },
    "status": {
      "stringValue": "error"
    }
  }
}
```

---

## Configuración de Credenciales

### 1. Groq API Key

**¿Qué es Groq?**
- Groq es una plataforma de inferencia LLM ultra-rápida (NO requieres agentes de IA)
- Ofrece acceso a modelos open-source (Llama, Mixtral, Gemma)
- API compatible con OpenAI (fácil de usar)
- Plan gratuito disponible con límites generosos

**Pasos para obtener tu API Key**:

1. **Regístrate en Groq**:
   - Ve a: https://console.groq.com
   - Crea una cuenta (gratis)

2. **Obtén tu API Key**:
   - Una vez logueado, ve a: https://console.groq.com/keys
   - Click en "Create API Key"
   - Dale un nombre (ej: "BookMatch n8n")
   - Copia la API Key (se muestra solo una vez)

3. **Configurar en n8n**:
   - **NO necesitas crear credencial** en n8n
   - Usarás HTTP Request con Header Authentication
   - En cada nodo HTTP que llame a Groq:
     - Authentication: Header Auth
     - Name: `Authorization`
     - Value: `Bearer tu_groq_api_key_aqui`

**Ejemplo de configuración en n8n**:
```
Header Name: Authorization
Header Value: Bearer gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

### 2. Firebase Service Account (Firestore)

**¿Qué es un Service Account?**
- Un Service Account es una identidad que permite a aplicaciones (como n8n) acceder a Firebase sin login de usuario
- Es como un "robot" con permisos específicos para leer/escribir en Firestore

**Pasos detallados para configurar**:

#### Paso 1: Generar el archivo de credenciales

1. **Ve a Firebase Console**:
   - URL: https://console.firebase.google.com
   - Selecciona tu proyecto: `bookmatch-522d5`

2. **Navega a Service Accounts**:
   - Click en ⚙️ (Settings) → **Project settings**
   - Selecciona la pestaña **Service accounts**

3. **Genera nueva clave privada**:
   - Scroll hasta abajo
   - Click en **Generate new private key**
   - Confirma en el diálogo (descargará un archivo JSON)

4. **Guarda el archivo JSON**:
   - Se descargará algo como: `bookmatch-522d5-firebase-adminsdk-xxxxx.json`
   - **¡GUÁRDALO EN LUGAR SEGURO! Es como una contraseña**

#### Paso 2: Configurar en n8n

**Opción A: Usando Google Service Account (Recomendado)**

1. En n8n, ve a **Credentials** (menú lateral)
2. Click en **+ Add Credential**
3. Busca y selecciona **"Google Service Account"**
4. Abre el archivo JSON que descargaste con un editor de texto
5. Copia TODO el contenido del JSON
6. Pega en el campo de n8n
7. Dale un nombre: "Firebase Bookmatch"
8. Click en **Save**

**Opción B: Usando Header Auth (Alternativa)**

Si la Opción A no funciona en tu versión de n8n:

1. Necesitas generar un **Access Token** temporal
2. Instala `firebase-tools`: 
   ```bash
   npm install -g firebase-tools
   ```
3. Login y obtén token:
   ```bash
   firebase login
   firebase login:ci
   ```
4. Usa el token en Header Auth:
   - Name: `Authorization`
   - Value: `Bearer TOKEN_AQUI`

#### Paso 3: Usar en HTTP Request nodes

En los nodos HTTP que llaman a Firestore:

- **Authentication**: Google Service Account
- **Credential**: Selecciona "Firebase Bookmatch"

**Ejemplo de URL para leer mensajes**:
```
https://firestore.googleapis.com/v1/projects/bookmatch-522d5/databases/(default)/documents/users/123/conversations/456/messages
```

**Permisos necesarios**:
El Service Account necesita rol **"Cloud Datastore User"** o **"Editor"**:
1. Ve a Google Cloud Console: https://console.cloud.google.com
2. IAM & Admin → IAM
3. Encuentra tu service account
4. Añade rol si no lo tiene

---

### 3. PostgreSQL

1. En n8n, crea credencial "Postgres"
2. Usa los datos de tu conexión de Render o donde esté alojada la BD:
   - **Host**: `ejemplo.render.com`
   - **Database**: `bookmatch_db`
   - **User**: `postgres`
   - **Password**: `tu_password`
   - **Port**: `5432`
   - **SSL**: Enabled (si es Render)

---

## Resumen de Credenciales Necesarias

| Servicio | Tipo | Dónde obtenerlo | Uso en n8n |
|----------|------|-----------------|------------|
| **Groq** | API Key | https://console.groq.com/keys | Header Auth en HTTP Request |
| **Firebase** | Service Account JSON | Firebase Console → Service Accounts | Google Service Account credential |
| **PostgreSQL** | User/Password | Render o tu hosting | Postgres credential |

---

## Configuración de Firestore Security Rules

### ¿Por qué son importantes las Security Rules?

Las Security Rules protegen tu base de datos de accesos no autorizados:
- **Sin rules**: Cualquiera puede leer/escribir en tu Firestore
- **Con rules**: Solo usuarios autenticados pueden acceder a SUS PROPIOS datos
- **Service Accounts**: El backend (n8n) puede actualizar mensajes gracias al Service Account

### Cómo configurar las Security Rules

**Paso 1: Ir a Firebase Console**

1. Ve a: https://console.firebase.google.com
2. Selecciona tu proyecto: `bookmatch-522d5`
3. En el menú lateral: **Firestore Database**
4. Click en la pestaña **Rules**

**Paso 2: Pegar las Security Rules**

Reemplaza las rules existentes con:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Función helper: verificar que el usuario está autenticado
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Función helper: verificar que el usuario es el dueño
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    // Función helper: verificar si es un Service Account (n8n)
    function isServiceAccount() {
      return request.auth.token.email != null 
        && request.auth.token.email.contains('@bookmatch-522d5.iam.gserviceaccount.com');
    }
    
    // Reglas para la colección users
    match /users/{userId} {
      // Permitir leer solo si es el usuario autenticado
      allow read: if isAuthenticated() && isOwner(userId);
      
      // Permitir escribir solo si es el usuario autenticado
      allow write: if isAuthenticated() && isOwner(userId);
      
      // Reglas para conversaciones
      match /conversations/{conversationId} {
        // Leer: solo el dueño
        allow read: if isAuthenticated() && isOwner(userId);
        
        // Crear: solo el dueño
        allow create: if isAuthenticated() && isOwner(userId);
        
        // Actualizar: el dueño o el Service Account (n8n)
        allow update: if (isAuthenticated() && isOwner(userId)) 
                      || isServiceAccount();
        
        // Borrar: solo el dueño
        allow delete: if isAuthenticated() && isOwner(userId);
        
        // Reglas para mensajes dentro de conversaciones
        match /messages/{messageId} {
          // Leer: solo el dueño
          allow read: if isAuthenticated() && isOwner(userId);
          
          // Crear: el dueño (para mensajes user) o Service Account (placeholder assistant)
          allow create: if (isAuthenticated() && isOwner(userId))
                        || isServiceAccount();
          
          // Actualizar: solo Service Account (n8n actualiza mensajes assistant)
          allow update: if isServiceAccount();
          
          // Borrar: solo el dueño
          allow delete: if isAuthenticated() && isOwner(userId);
        }
      }
    }
  }
}
```

**Paso 3: Publicar las Rules**

1. Click en **Publish**
2. Confirmar la publicación

**Paso 4: Probar las Rules (opcional)**

En la pestaña **Rules Playground**:

**Test 1 - Usuario autenticado lee sus conversaciones**:
```
Operation: get
Path: /users/USER_ID/conversations/CONV_ID
Authentication: Authenticated (UID: USER_ID)
Resultado esperado: ✅ Allow
```

**Test 2 - Usuario autenticado intenta leer conversaciones de otro**:
```
Operation: get
Path: /users/OTRO_USER_ID/conversations/CONV_ID
Authentication: Authenticated (UID: USER_ID)
Resultado esperado: ❌ Deny
```

**Test 3 - Usuario no autenticado intenta leer**:
```
Operation: get
Path: /users/USER_ID/conversations/CONV_ID
Authentication: Unauthenticated
Resultado esperado: ❌ Deny
```

### Explicación de las Rules

**Para usuarios normales (Angular)**:
- ✅ Pueden leer SUS conversaciones y mensajes
- ✅ Pueden crear nuevas conversaciones
- ✅ Pueden crear mensajes (tipo 'user')
- ❌ NO pueden leer conversaciones de otros usuarios
- ❌ NO pueden actualizar mensajes assistant (solo n8n puede)

**Para Service Account (n8n)**:
- ✅ Puede crear mensajes assistant placeholder
- ✅ Puede actualizar mensajes assistant (status, content, metadata)
- ✅ Puede actualizar conversaciones (messageCount, updatedAt)
- ❌ NO puede leer conversaciones (no necesario en el workflow actual)

### Verificar que el Service Account funciona

**En n8n, después de configurar:**

1. Ejecuta el workflow completo
2. Si ves error `PERMISSION_DENIED` en el nodo Update Firestore:
   - Ve a Google Cloud Console: https://console.cloud.google.com
   - IAM & Admin → IAM
   - Busca tu Service Account: `firebase-adminsdk-xxxxx@bookmatch-522d5.iam.gserviceaccount.com`
   - Verifica que tenga rol **"Cloud Datastore User"** o **"Editor"**
   - Si no lo tiene, añádelo

### Troubleshooting Security Rules

**Error: Missing or insufficient permissions**
- **Causa**: El usuario no tiene permiso para esa operación
- **Solución**: Verifica que `request.auth.uid` coincida con el `userId` del path

**Error: Service Account cannot update**
- **Causa**: La función `isServiceAccount()` no reconoce al Service Account
- **Solución**: Verifica el email del Service Account:
  ```javascript
  // En la función isServiceAccount(), ajusta el dominio si es diferente
  request.auth.token.email.contains('@TU_PROJECT_ID.iam.gserviceaccount.com')
  ```

**Error: Angular no puede crear conversaciones**
- **Causa**: El usuario no está autenticado correctamente
- **Solución**: Verifica que `AuthService` esté funcionando y que `currentUser()` devuelva el UID correcto

---

## Testing

### Test 1: Book Recommendation
**Input**: "Busco libros de fantasía épica como El Señor de los Anillos"  
**Esperado**: SQL query generada → Libros encontrados → Respuesta con recomendaciones

### Test 2: Casual Chat
**Input**: "Hola, ¿cómo estás?"  
**Esperado**: Respuesta amigable breve

### Test 3: Out of Scope
**Input**: "¿Cuál es el clima hoy?"  
**Esperado**: Mensaje explicando que solo ayuda con libros

---

## Mejoras Futuras

### 1. Streaming de Respuestas

**¿Por qué streaming?**
- Mejor UX: usuario ve la respuesta generándose en tiempo real
- Reduce percepción de latencia (especialmente con compound)

**Cómo implementar con Groq**:
- Groq soporta streaming: añade `"stream": true` al body
- La respuesta viene en chunks via Server-Sent Events (SSE)
- Necesitas un endpoint en el backend que procese el stream y actualice Firestore
- En Angular, el `onSnapshot` actualizará el contenido progresivamente

**Complejidad**: Alta (requiere cambios en backend y manejo de SSE)

### 2. Detección de Idioma Automática

**Con compound**:
```javascript
const detectLanguagePrompt = `Detecta el idioma del mensaje y responde en JSON:
{
  "lang": "es",
  "langFull": "Español"
}

MENSAJE: ${userMessage}`;
```

### 3. Vector Search en Descripciones

**Integración con embeddings**:
- Usar Groq para generar embeddings de descripciones
- Almacenar en PostgreSQL con extensión `pgvector`
- Búsqueda semántica: "libros sobre superación personal" → encuentra libros aunque no tengan esas palabras exactas

### 4. Memoria a Largo Plazo

**Con compound y contexto amplio**:
- Ya tienes ~128k tokens de contexto con compound
- Puedes cargar conversaciones completas antiguas
- El modelo recordará preferencias del usuario a lo largo del tiempo

### 5. Analytics de Thoughts

**Aprovechar los thoughts reales**:
- Analizar qué categorías son más buscadas (extrayendo de thoughts)
- Identificar patrones en razonamiento del modelo
- Mejorar prompts basándote en thoughts que generan mejores resultados

### 6. Fine-tuning con Feedback

**Usar thoughts para mejorar**:
- Si usuario acepta recomendación → thoughts buenos
- Si usuario rechaza → analizar thoughts para mejorar prompt
- Crear dataset de "buenos thoughts" para refinar el sistema

---

## Troubleshooting

### Problema: Error 401 en Groq API
**Síntomas**: `Unauthorized` o `Invalid API Key`  
**Solución**: 
1. Verifica que tu API Key sea correcta
2. Asegúrate de incluir `Bearer` antes de la key: `Bearer gsk_xxx`
3. Verifica que la key no haya expirado en Groq Console

### Problema: Error 429 en Groq (Rate Limit)
**Síntomas**: `Too Many Requests`  
**Solución**: 
- Groq tiene límites de requests por minuto (depende del plan)
- Espera unos segundos y reintenta
- Considera añadir un delay entre requests en n8n

### Problema: Groq devuelve respuesta vacía
**Síntomas**: `choices[0].message.content` está vacío  
**Solución**:
1. Revisa tu prompt - puede ser demasiado restrictivo
2. Aumenta `max_tokens` (el modelo puede necesitar más espacio)
3. Verifica en Groq Playground que el prompt funciona

### Problema: El modelo compound no devuelve JSON válido
**Síntomas**: Error al parsear `JSON.parse(content)`  
**Solución**:
1. Asegúrate de usar `"response_format": { "type": "json_object" }` en el body
2. En el prompt, sé MUY explícito: "RESPONDE ÚNICAMENTE EN FORMATO JSON"
3. Proporciona un ejemplo de la estructura JSON esperada en el prompt
4. Usa try-catch en el Function Node para manejar errores

**Ejemplo de prompt robusto**:
```javascript
const prompt = `RESPONDE ÚNICAMENTE EN FORMATO JSON. NO añadas texto antes o después del JSON.

ESTRUCTURA REQUERIDA:
{
  "thoughts": ["paso 1", "paso 2"],
  "response": "tu respuesta aquí"
}

PREGUNTA: ${userMessage}`;
```

### Problema: Los thoughts son demasiado genéricos
**Síntomas**: Thoughts como "analizando solicitud", "procesando"  
**Solución**:
1. Pide thoughts MÁS específicos en el prompt:
   - "Explica QUÉ categorías detectaste y POR QUÉ"
   - "Describe QUÉ criterios usaste para filtrar"
2. Usa el modelo compound (mejor razonamiento que llama o mixtral)
3. Aumenta ligeramente la temperature (0.2-0.3) para más variedad

### Problema: El modelo compound es muy lento
**Síntomas**: Respuestas tardan >10 segundos  
**Solución**:
- Es normal, compound hace routing entre modelos
- Si necesitas velocidad, usa `llama-3.3-70b-versatile` directamente
- El tradeoff: compound es más lento pero mejor razonamiento
- Para casual chat, puedes usar `llama-3.3-70b-versatile` (más rápido)

### Problema: No puedo extraer la respuesta de Groq
**Síntomas**: Error al acceder a `$json.choices[0]`  
**Solución**:
```javascript
// En Function Node después de Groq
const response = $json.body || $json; // A veces viene en .body
const content = response.choices[0].message.content;
return { ...($input.item.json), aiResponse: content };
```

### Problema: Query SQL mal formada
**Solución**: 
- Ajustar temperature a 0.0-0.1 (más determinista)
- Ser MÁS específico en el prompt
- Probar el prompt primero en Groq Playground

### Problema: Firestore update falla
**Síntomas**: Error 403 o Permission Denied  
**Solución**: 
1. Verifica que el Service Account tenga rol "Cloud Datastore User"
2. Verifica la estructura del JSON (debe usar `stringValue`, `arrayValue`, etc.)
3. Comprueba que el path de Firestore sea correcto

### Problema: Firebase Service Account no funciona
**Síntomas**: `Invalid credentials` en HTTP Request  
**Solución**:
1. Verifica que hayas copiado TODO el JSON del Service Account
2. En Google Cloud Console, verifica que el Service Account tenga permisos
3. Prueba regenerar una nueva clave privada

### Problema: Timeout en n8n
**Solución**: 
- Aumentar timeout en settings del workflow (default 5min)
- Groq es muy rápido, si hay timeout probablemente sea otro nodo (Firestore o PostgreSQL)

### Problema: PostgreSQL no devuelve resultados
**Síntomas**: Query ejecuta pero devuelve array vacío  
**Solución**:
1. Prueba la query generada directamente en tu BD
2. Verifica que haya datos que coincidan con los criterios
3. Simplifica el prompt para generar queries más amplias

### Debugging Tips

**Ver requests de Groq**:
En n8n, después de ejecutar el workflow:
1. Click en el nodo HTTP Request de Groq
2. Ve a la pestaña "JSON"
3. Verás el request y response completos

**Probar prompts en Groq Playground**:
1. Ve a: https://console.groq.com/playground
2. Selecciona el modelo: `llama-3.3-70b-versatile`
3. Pega tu prompt y pruébalo antes de usar en n8n
4. Ajusta el prompt hasta que funcione bien

---

## Resumen de Configuración

| Nodo | Tipo | Configuración Clave |
|------|------|---------------------|
| 1. Webhook | Webhook | POST, Response: Immediately |
| 2. Intent Detection | Function | Keywords matching |
| 3. Switch Intent | Switch | 3 rutas según intentType |
| 4A. Load Context | HTTP Request | Firestore GET últimos 10 mensajes + Service Account |
| 5A. Build SQL Prompt | Function | Structured output prompt |
| 6A. Generate SQL | HTTP Request | Groq compound, `response_format: json_object` |
| 7A. Extract SQL + Thoughts | Function | Parse JSON, extract thoughts |
| 8A. Execute SQL | PostgreSQL | Dynamic query execution |
| 9A. Format Books | Function | Prepare book list |
| 10A. Build Response Prompt | Function | Structured output prompt |
| 11A. Generate Response | HTTP Request | Groq compound, `response_format: json_object` |
| 12A. Extract Response + Thoughts | Function | Parse JSON, combine all thoughts |
| 4B. Build Casual Prompt | Function | Structured output prompt |
| 5B. Casual Chat | HTTP Request | Groq compound, Temp: 0.8 |
| 6B. Extract Casual Response | Function | Parse JSON, extract thoughts |
| 4C. Out of Scope | Set | Fixed decline message |
| 13. Merge | Merge | Combine all paths |
| 14. Update Firestore | HTTP Request | PATCH message + metadata + Service Account |

**Características principales**:
- ✅ Thoughts REALES generados por el modelo compound
- ✅ Structured output con `response_format: json_object`
- ✅ Thoughts del SQL + Thoughts del Response = 6-10 thoughts por mensaje
- ✅ Contexto amplio (~128k tokens con compound)

---

---

## Ejemplo Visual Completo del Workflow

```
┌─────────────────────────────────────────────────────────────────────────┐
│  INICIO: Usuario envía mensaje desde Angular → Backend → n8n Webhook   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │  1. Webhook (Recibir datos)  │
                    └───────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │  2. Function: Intent Detection│
                    │  (analizar userMessage)       │
                    └───────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │  3. Switch (3 rutas)          │
                    └───────────────────────────────┘
                        │           │            │
           ┌────────────┘           │            └────────────┐
           │                        │                         │
           ▼                        ▼                         ▼
┌─────────────────────┐  ┌──────────────────┐  ┌──────────────────────┐
│  RUTA A: Libros     │  │  RUTA B: Casual  │  │  RUTA C: Out Scope   │
└─────────────────────┘  └──────────────────┘  └──────────────────────┘
           │                        │                         │
           ▼                        ▼                         │
    [HTTP: Firestore]        [HTTP: Groq]              [Set: mensaje]
    Cargar contexto          Respuesta breve                  │
           │                        │                         │
           ▼                        │                         │
    [Function]                      │                         │
    Procesar contexto               │                         │
           │                        │                         │
           ▼                        │                         │
    [Function]                      │                         │
    Construir prompt SQL            │                         │
           │                        │                         │
           ▼                        │                         │
    [HTTP: Groq]                    │                         │
    Generar SQL Query               │                         │
           │                        │                         │
           ▼                        │                         │
    [Function]                      │                         │
    Limpiar SQL                     │                         │
           │                        │                         │
           ▼                        │                         │
    [PostgreSQL]                    │                         │
    Ejecutar query                  │                         │
           │                        │                         │
           ▼                        │                         │
    [Function]                      │                         │
    Formatear libros                │                         │
           │                        │                         │
           ▼                        │                         │
    [Function]                      │                         │
    Construir prompt respuesta      │                         │
           │                        │                         │
           ▼                        │                         │
    [HTTP: Groq]                    │                         │
    Generar respuesta markdown      │                         │
           │                        │                         │
           ▼                        │                         │
    [Function]                      │                         │
    Extraer respuesta + metadata    │                         │
           │                        │                         │
           └────────────┬───────────┘                         │
                        │                                     │
                        └──────────────┬──────────────────────┘
                                       │
                                       ▼
                        ┌──────────────────────────┐
                        │  8. Merge (unificar)     │
                        └──────────────────────────┘
                                       │
                                       ▼
                        ┌──────────────────────────┐
                        │  9. HTTP: Firestore      │
                        │  PATCH mensaje (update)  │
                        └──────────────────────────┘
                                       │
                                       ▼
                            ┌──────────────────┐
                            │  FIN: Angular    │
                            │  recibe update   │
                            │  (onSnapshot)    │
                            └──────────────────┘
```

---

## Quick Start Checklist

Antes de empezar a construir el workflow, asegúrate de tener:

- [ ] API Key de Groq obtenida y probada con curl
- [ ] Modelo `compound` probado en Groq Playground
- [ ] Prompts de structured output validados (devuelven JSON válido)
- [ ] Firebase Service Account JSON descargado
- [ ] Service Account configurado en n8n como credential
- [ ] PostgreSQL credential configurada en n8n
- [ ] Variable `N8N_WEBHOOK_URL` añadida en backend `.env`
- [ ] Backend desplegado y funcionando
- [ ] Angular funcionando y conectado a Firestore
- [ ] Firestore Security Rules configuradas

**Tiempo estimado de configuración**: 2-3 horas  
**Número total de nodos**: ~18-22 (con structured output)

**Prueba básica antes de empezar**:
```bash
# 1. Probar API Key de Groq
curl -X POST "https://api.groq.com/openai/v1/chat/completions" \
  -H "Authorization: Bearer TU_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"compound","messages":[{"role":"user","content":"test"}]}'

# 2. Probar Service Account (con tu JSON)
# Debería devolver status 200 o datos de Firestore
```

---

**Nota Final**: Este workflow está diseñado para ser modular y escalable. Puedes agregar más rutas, mejorar los prompts o integrar servicios adicionales según necesites.

**¿Necesitas ayuda?** 
- Groq Docs: https://console.groq.com/docs
- n8n Community: https://community.n8n.io
- Firebase Docs: https://firebase.google.com/docs/firestore

