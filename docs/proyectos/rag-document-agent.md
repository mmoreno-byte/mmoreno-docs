# RAG Document Agent

Agente conversacional que permite subir documentos PDF y hacerles preguntas en lenguaje natural, **en cualquier idioma**, ejecutándose 100% en local sin enviar datos a servicios externos.

**Repositorio:** https://github.com/mmoreno-byte/ai-portfolio-agent

## Stack

- **Frontend:** React 19 + Vite + Axios
- **Backend:** FastAPI + SQLAlchemy + Uvicorn
- **Vector store:** ChromaDB
- **Orquestación RAG:** LangChain + `langchain-ollama` + `langchain-community`
- **Embeddings y LLM:** Ollama (`nomic-embed-text` para embeddings, `llama3.2` para generación)
- **Persistencia:** PostgreSQL (historial de conversación)
- **Infraestructura:** Docker Compose (Postgres + backend + frontend)
- **PDFs:** `pypdf` para extracción de texto
- **Detección de idioma:** `langdetect`

## Arquitectura

```
┌──────────────────┐     HTTP/JSON     ┌────────────────────┐
│   React + Vite   │ ────────────────▶ │  FastAPI backend   │
│   Frontend       │                   │  LangChain + Chroma│
│   (Drag & drop)  │ ◀──────────────── │  + Ollama (llocal) │
└──────────────────┘                   └────────────────────┘
        │                                       │
        │                                       ├──▶ ChromaDB (vectores por documento)
        │                                       │
        │                                       ├──▶ PostgreSQL (historial)
        │                                       │
        │                                       └──▶ Ollama (LLM + embeddings)
        │
        └── Docker Compose
            ├── postgres:16
            ├── backend (FastAPI)
            └── frontend (Vite dev)
```

Flujo:

1. El PDF se sube desde React al backend
2. FastAPI lo divide en fragmentos con `langchain-text-splitters`
3. Cada fragmento se vectoriza con `nomic-embed-text` y se guarda en ChromaDB
4. Al preguntar, se detecta el idioma de la pregunta con `langdetect`
5. Se recupera contexto, se construye el prompt con el idioma forzado, y `llama3.2` genera la respuesta en ese idioma
6. La conversación se guarda en PostgreSQL

## docker-compose.yml

El proyecto se levanta completo con un único comando:

```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: aiuser
      POSTGRES_PASSWORD: aipassword
      POSTGRES_DB: ai_agent_db
    ports: ["5432:5432"]
    volumes: [postgres_data:/var/lib/postgresql/data]

  backend:
    build: ./backend
    ports: ["8000:8000"]
    environment:
      DATABASE_URL: postgresql://aiuser:aipassword@postgres:5432/ai_agent_db
      OLLAMA_BASE_URL: http://host.docker.internal:11434
    depends_on: [postgres]
    volumes: [./backend:/app, chroma_data:/app/chroma_db]

  frontend:
    build: ./frontend
    ports: ["5173:5173"]
    depends_on: [backend]
    volumes: [./frontend:/app, /app/node_modules]

volumes:
  postgres_data:
  chroma_data:
```

```bash
git clone https://github.com/mmoreno-byte/ai-portfolio-agent
cd ai-portfolio-agent
docker compose up --build
```

Antes necesitas Ollama corriendo en el host y los modelos descargados:

```bash
ollama pull llama3.2
ollama pull nomic-embed-text
```

## Retos técnicos

### Modelos separados para embeddings y generación

Intentar usar `llama3.2` para generar embeddings falla: no es un modelo de embeddings. La solución fue usar `nomic-embed-text` específicamente para vectorizar, y `llama3.2` solo para generar respuestas.

```python
from langchain_ollama import OllamaEmbeddings, ChatOllama

embeddings = OllamaEmbeddings(model="nomic-embed-text")
llm = ChatOllama(model="llama3.2")
```

### Respuesta en el idioma de la pregunta, no del documento

El LLM tendía a "copiar" el idioma del contexto recuperado, ignorando instrucciones de idioma en el prompt. Se resolvió detectando el idioma de la pregunta con `langdetect` y forzándolo explícitamente como variable en el prompt final, en vez de depender de una instrucción condicional.

```python
from langdetect import detect

user_lang = detect(user_question)  # 'es', 'en', 'fr'...
prompt = f"""Responde siempre en el idioma ISO-639-1 '{user_lang}'.
No uses el idioma del contexto si es diferente.
..."""
```

### Una colección de ChromaDB por documento

Aísla el contexto de búsqueda entre documentos distintos y permite borrar uno sin afectar a los demás. Nombre de colección = hash del documento.

### ChromaDB necesita SQLite moderno

ChromaDB 0.5.x usa sqlite ≥ 3.35 para su cliente embebido. Si tu imagen Docker tiene una versión más antigua, hay que instalar `pysqlite3-binary` y monkey-patch antes de importar ChromaDB:

```python
__import__('pysqlite3')
import sys
sys.modules['sqlite3'] = sys.modules.pop('pysqlite3')
```

## Funcionalidades

- Subida de PDFs con drag & drop
- Preguntas en lenguaje natural
- **Respuesta en el idioma de la pregunta**, no en el idioma del documento
- Historial de conversación persistente por documento (PostgreSQL)
- Gestión completa: subir, consultar y eliminar documentos desde la interfaz
- 100% local — ningún dato sale a servicios externos

## Endpoints principales del backend

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/documents` | Subir PDF |
| GET | `/api/documents` | Listar documentos |
| DELETE | `/api/documents/{id}` | Eliminar documento |
| POST | `/api/chat/{doc_id}` | Preguntar al documento (streaming) |
| GET | `/api/chat/{doc_id}/history` | Historial de la conversación |

## Lecciones aprendidas

1. **RAG es 80% Retrieval, 20% Generation**: la calidad de las respuestas depende más de cómo divides y embeddes los documentos que del modelo que elijas. Un chunking pobre arruina un buen LLM.
2. **El idioma del LLM "se pega" al contexto**: si el documento está en inglés y la pregunta en español, el modelo tiende a responder en inglés. Forzar el idioma en el prompt no basta; hay que detectarlo y pasarlo como variable explícita.
3. **LangChain abstrae, pero no esconde la complejidad**: para debug, sigue siendo útil saber qué se está enviando al LLM y qué se está recuperando del vector store. Imprime los chunks y los prompts siempre.
4. **Docker Compose para proyectos full-stack de datos**: tres servicios (Postgres + backend + frontend) en un único archivo. Si necesitas reset, `docker compose down -v` y vuelta a empezar.

---

*El RAG Document Agent me enseñó que los LLM no son magia — son una pieza más en un pipeline, y cada pieza (chunking, embeddings, retrieval, prompt, generación) tiene su propio conjunto de problemas que resolver.*
