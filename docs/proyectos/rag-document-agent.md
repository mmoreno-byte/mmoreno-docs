# RAG Document Agent

Agente conversacional que permite subir documentos PDF y hacerles preguntas en lenguaje natural, **en cualquier idioma**.

**Repositorio:** https://github.com/mmoreno-byte/ai-portfolio-agent
**Demo en producción:** https://mmoreno-byte.github.io/ai-portfolio-agent/

## Stack

- **Frontend:** React 19 + Vite + Axios — GitHub Pages
- **Backend:** FastAPI + SQLAlchemy + Uvicorn — Render (Docker)
- **Vector store:** ChromaDB
- **Orquestación RAG:** LangChain + `langchain-community`
- **Embeddings:** Cohere (`embed-multilingual-v3.0`)
- **LLM:** Groq (`openai/gpt-oss-120b`)
- **Persistencia:** PostgreSQL en Neon (historial de conversación)
- **PDFs:** `pypdf` para extracción de texto
- **Detección de idioma:** `langdetect`

*(En local sigue pudiendo levantarse todo con Docker Compose + Ollama, ver más abajo — pero la demo en producción usa Cohere y Groq porque un LLM local no cabe en el free tier de ningún hosting.)*

## Arquitectura

```
┌──────────────────┐     HTTP/JSON     ┌────────────────────┐
│   React + Vite   │ ────────────────▶ │   Render (Docker)  │
│   GitHub Pages   │                   │  LangChain + Chroma│
│   (Drag & drop)  │ ◀──────────────── │                    │
└──────────────────┘                   └────────────────────┘
                                               │
                                               ├──▶ ChromaDB (vectores por documento, en disco)
                                               │
                                               ├──▶ PostgreSQL en Neon (historial)
                                               │
                                               ├──▶ Cohere (embeddings)
                                               │
                                               └──▶ Groq (LLM)
```

Flujo:

1. El PDF se sube desde React al backend
2. FastAPI lo divide en fragmentos con `langchain-text-splitters`
3. Cada fragmento se vectoriza con Cohere y se guarda en ChromaDB
4. Al preguntar, se detecta el idioma de la pregunta con `langdetect`
5. Se recupera contexto, se construye el prompt con el idioma forzado, y Groq genera la respuesta en ese idioma
6. La conversación se guarda en PostgreSQL (Neon)

## docker-compose.yml (desarrollo local)

Para desarrollo local, el proyecto se puede levantar completo con un único comando, usando Ollama en vez de Cohere/Groq:

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

Un modelo de chat no sirve para generar embeddings. La solución es usar un proveedor especializado en embeddings para vectorizar, y uno de chat solo para generar respuestas — en producción, Cohere para lo primero y Groq para lo segundo:

```python
from langchain_cohere import CohereEmbeddings
from langchain_groq import ChatGroq

embeddings = CohereEmbeddings(model="embed-multilingual-v3.0")
llm = ChatGroq(model="openai/gpt-oss-120b")
```

### Por qué no Ollama en producción

En local, Ollama (`nomic-embed-text` + `llama3.2`) funciona perfectamente y sin depender de ningún servicio externo. El problema es desplegarlo: un LLM local necesita varios GB de RAM, algo que no cabe en el free tier de ningún hosting (Render free son 512MB compartidos). Para la demo pública hubo que sustituir ambos por APIs gratuitas en la nube (Cohere + Groq), manteniendo exactamente la misma arquitectura RAG.

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

## Endpoints principales del backend

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/documents/upload` | Subir PDF |
| GET | `/documents` | Listar documentos |
| DELETE | `/documents/{id}` | Eliminar documento |
| POST | `/documents/{id}/ask` | Preguntar al documento |
| GET | `/documents/{id}/history` | Historial de la conversación |

## Lecciones aprendidas

1. **RAG es 80% Retrieval, 20% Generation**: la calidad de las respuestas depende más de cómo divides y embeddes los documentos que del modelo que elijas. Un chunking pobre arruina un buen LLM.
2. **El idioma del LLM "se pega" al contexto**: si el documento está en inglés y la pregunta en español, el modelo tiende a responder en inglés. Forzar el idioma en el prompt no basta; hay que detectarlo y pasarlo como variable explícita.
3. **LangChain abstrae, pero no esconde la complejidad**: para debug, sigue siendo útil saber qué se está enviando al LLM y qué se está recuperando del vector store. Imprime los chunks y los prompts siempre.
4. **Docker Compose para proyectos full-stack de datos**: tres servicios (Postgres + backend + frontend) en un único archivo. Si necesitas reset, `docker compose down -v` y vuelta a empezar.
5. **Llevar un LLM local a producción gratis no es viable**: Ollama funciona genial en desarrollo, pero ningún free tier tiene la RAM para un modelo de varios GB. La migración pasó por varios intentos — un modelo de embeddings ligero (ONNX) seguía agotando los 512MB del contenedor; la API de Google fallaba por una suspensión de cuenta ajena al código — hasta llegar a Cohere + Groq, ambos con planes gratuitos pensados para esto.
6. **ChromaDB en disco no sobrevive un redeploy**: en el free tier de Render el disco no es persistente entre despliegues, así que cada documento subido se pierde si el servicio se reinicia o se actualiza el código. Aceptable para una demo (el visitante sube su propio PDF en su sesión), pero es una limitación real a tener en cuenta.
7. **Los parámetros de URL no siempre son UTF-8 de forma fiable**: enviar la pregunta como query param (`?question=...`) corrompía tildes y eñes al llegar al backend. Pasar la pregunta por el cuerpo de la petición (JSON) en vez de la URL elimina la ambigüedad de codificación por completo.

---

*El RAG Document Agent me enseñó que los LLM no son magia — son una pieza más en un pipeline, y cada pieza (chunking, embeddings, retrieval, prompt, generación) tiene su propio conjunto de problemas que resolver.*
