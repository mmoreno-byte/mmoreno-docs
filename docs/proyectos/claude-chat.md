# Claude Chat

Chat con IA estilo ChatGPT, construido con Python/Flask en el backend y React en el frontend. Usa el modelo Llama 3.3 70b via Groq API.

**Repositorio:** https://github.com/mmoreno-byte/claude-chat

## TL;DR

Frontend React que envía mensajes → Flask backend → Groq API (Llama 3.3) → respuesta streaming → React renderiza Markdown. La API key de Groq se mantiene en el backend, nunca expuesta al frontend.

## Arquitectura

```
┌─────────────┐         ┌─────────────────┐         ┌──────────────┐
│   React     │         │   Flask Backend │         │  Groq API   │
│   Frontend  │ ──────▶ │   (Python)     │ ──────▶ │  Llama 3.3  │
│   (Markdown)│ ◀────── │   Streaming    │ ◀────── │  70b        │
└─────────────┘  SSE    └─────────────────┘  Token  └──────────────┘
```

## Groq vs OpenAI vs Anthropic

Elegí Groq por:

- **Hardware dedicado para inference**: Groq usa hardware específico para running modelos, lo que hace la inference muy rápida
- **Free tier disponible**: suficiente para desarrollo y testing
- **Modelos disponibles**: Llama 3.3 70b es un modelo muy capaz

## Backend: Flask + Streaming

```python
# backend/app.py
from flask import Flask, jsonify, request, Response
from flask_cors import CORS
from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})

@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.json
    messages = data.get("messages", [])

    def generate():
        stream = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            stream=True
        )
        for chunk in stream:
            if chunk.choices[0].delta.content:
                yield f"data: {chunk.choices[0].delta.content}\n\n"

    return Response(
        generate(),
        mimetype="text/event-stream",
        headers={"Cache-Control": "no-cache"}
    )
```

## Streaming con Server-Sent Events (SSE)

El streaming permite que la respuesta llegue token a token, como ChatGPT:

```
data: H
data: ola
data: ,
data:  c
data: ó
data: mo
data:  te
data:  va
data: s?
```

El frontend recibe cada fragmento y lo añade al mensaje:

```jsx
const response = await fetch("/api/chat", {
  method: "POST",
  body: JSON.stringify({ messages }),
  headers: { "Content-Type": "application/json" }
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const text = decoder.decode(value);
  setMessage((prev) => prev + text);
}
```

## Frontend: React + Markdown

```jsx
// App.jsx
import ReactMarkdown from "react-markdown";
import SyntaxHighlighter from "react-syntax-highlighter";

const Message = ({ role, content }) => {
  return (
    <div className={`message ${role}`}>
      <ReactMarkdown
        components={{
          code: ({ node, inline, children }) => (
            <SyntaxHighlighter language="javascript">
              {children}
            </SyntaxHighlighter>
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
```

## Seguridad: API key en el backend

**Nunca hagas esto:**
```jsx
// ❌ NO: exposing API key to frontend
const response = await fetch("https://api.groq.com/openai/v1/chat", {
  headers: { "Authorization": `Bearer ${groqApiKey}` }  // Key visible!
});
```

**Lo correcto:**
```python
# ✅ Sí: backend guarda la key
client = Groq(api_key=os.getenv("GROQ_API_KEY"))  # Solo en backend
```

El frontend solo habla con tu backend Flask. La API key nunca sale del servidor.

## Problema: mensajes truncados

Groq tiene límite de tokens por mensaje (~8k tokens de contexto). Mensajes muy largos se cortan.

**Solución: límite en frontend + slicing en backend**

```jsx
// Frontend: no enviar más de 4000 caracteres
const truncated = message.slice(-4000);
```

## Historial de conversaciones

```jsx
const [conversations, setConversations] = useState([]);
const [activeId, setActiveId] = useState(null);

const handleNewChat = () => {
  const newChat = { id: Date.now(), messages: [] };
  setConversations([...conversations, newChat]);
  setActiveId(newChat.id);
};
```

## Lecciones aprendidas

1. **Server-Sent Events es más simple que WebSockets para streaming unidireccional**: no necesitas bidireccional para un chat. SSE es HTTP puro, más fácil de implementar.

2. **El streaming debe manejarse en ambos extremos**: no basta con que el backend haga streaming; el frontend necesita leer el stream incrementalmente con `response.body.getReader()`.

3. **Groq es rápido pero tiene límites**: el free tier es generoso, pero necesitas manejar errores de rate limit gracefully.

---

*Claude Chat me enseñó cómo funcionan los modelos de lenguaje en producción: streaming, contexto limitado, y la importancia de no exponer API keys.*
