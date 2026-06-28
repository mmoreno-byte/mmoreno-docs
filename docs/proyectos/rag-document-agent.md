# RAG Document Agent

Agente conversacional que permite subir documentos PDF y hacerles preguntas en lenguaje natural, **en cualquier idioma**, ejecutándose 100% en local sin enviar datos a servicios externos.

## Stack

- **Frontend:** React + Vite
- **Backend:** FastAPI + SQLAlchemy
- **Vector store:** ChromaDB
- **Orquestación RAG:** LangChain
- **LLM y embeddings:** Ollama (`llama3.2` + `nomic-embed-text`)
- **Persistencia:** PostgreSQL
- **Infraestructura:** Docker Compose

## Arquitectura

React → FastAPI → ChromaDB (vectores)

↓

PostgreSQL (historial)

↓

Ollama (LLM local)

1. El PDF se sube desde React al backend
2. FastAPI lo divide en fragmentos con LangChain
3. Cada fragmento se convierte en vector con `nomic-embed-text` y se guarda en ChromaDB
4. Al preguntar, se detecta el idioma de la pregunta y se genera una respuesta en ese idioma con `llama3.2`
5. La conversación se guarda en PostgreSQL

## Retos técnicos

**Modelos separados para embeddings y generación.** Intentar usar `llama3.2` para generar embeddings falla — no es un modelo de embeddings. La solución fue usar `nomic-embed-text` específicamente para vectorizar, y `llama3.2` solo para generar las respuestas finales.

**Respuesta en el idioma de la pregunta, no del documento.** El LLM tendía a "copiar" el idioma del contexto recuperado, ignorando instrucciones de idioma en el prompt. Se resolvió detectando el idioma de la pregunta con `langdetect` y forzándolo explícitamente como variable en el prompt final, en vez de depender de una instrucción condicional.

**Una colección de ChromaDB por documento.** Aísla el contexto de búsqueda entre documentos distintos y permite borrar uno sin afectar a los demás.

## Funcionalidades

- Subida de PDFs con drag & drop
- Preguntas en lenguaje natural, respuesta en el mismo idioma de la pregunta
- Historial de conversación persistente por documento
- Gestión completa: subir, consultar y eliminar documentos desde la interfaz

## Enlaces

- [Repositorio en GitHub](https://github.com/mmoreno-byte/ai-portfolio-agent)