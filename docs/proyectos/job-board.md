# Job Board

Filtrador de ofertas de trabajo en informática usando la API de Jooble. Proyecto simple que me sirvió para practicar la integración de APIs externas y separar backend/frontend con FastAPI.

**Repositorio:** https://github.com/mmoreno-byte/job-board
**Backend (API):** https://job-board-api-s56y.onrender.com
**Docs Swagger:** https://job-board-api-s56y.onrender.com/docs
**Frontend en vivo:** https://job-board-32q.pages.dev

## TL;DR

Backend FastAPI que consulta la API de Jooble (o sirve datos mock si no hay API key configurada), frontend HTML/CSS/JS vanilla sin build. Backend desplegado en Render (free tier), frontend en Cloudflare Pages. Un GitHub Action hace ping cada 12 min al backend para que el free tier de Render no se duerma.

## Arquitectura

```
┌─────────────┐     fetch/JSON    ┌──────────────────────────┐
│  Frontend   │ ────────────────▶ │   Render (FastAPI)        │
│  (vanilla   │ ◀────────────────  │   Python 3.11             │
│   JS)       │                   └──────────────────────────┘
│ Cloudflare  │                          │
│   Pages     │                          ▼
└─────────────┘                 API Jooble (si hay API key)
                                 o datos mock (si no la hay)
```

Sin base de datos: no hay nada que persistir, cada búsqueda es una consulta directa (a Jooble o al array mock).

## API Jooble

Jooble es un agregador de ofertas de empleo. Su API permite buscar ofertas:

```
POST https://jooble.org/api/[API_KEY]
{
  "keywords": "backend developer",
  "location": "Sevilla",
  "page": 1
}
```

Requiere una API key gratuita (registro en https://es.jooble.org/api/). Sin ella, el backend no falla: cae automáticamente a un set de 5 ofertas de ejemplo (`MOCK_JOBS`), así que la demo funciona igual sin depender de un servicio externo.

## Backend: FastAPI

```python
# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routers import jobs

load_dotenv()

app = FastAPI(title="Job Board API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(jobs.router)
```

`CORSMiddleware` con `allow_origins=["*"]` porque es una API de solo lectura, pública, sin autenticación ni datos sensibles — no hay motivo para restringir origen.

## Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Health check / info |
| GET | `/jobs/filters/options` | Ubicaciones, tipos y tecnologías disponibles |
| POST | `/jobs/search` | Buscar ofertas (Jooble real o mock) |
| GET | `/jobs/{job_id}` | Detalle de una oferta (solo mock) |

### Ejemplo: búsqueda

```bash
curl -X POST https://job-board-api-s56y.onrender.com/jobs/search \
  -H "Content-Type: application/json" \
  -d '{"keywords": "react", "page": 1}'
```

## Fallback a datos mock

```python
# backend/routers/jobs.py
@router.post("/search")
def search_jobs(request: JobSearchRequest) -> JobSearchResponse:
    api_key = jooble.get_api_key()

    if api_key:
        try:
            return jooble.search_jobs(request)
        except ValueError as e:
            raise HTTPException(status_code=503, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Error en Jooble API: {str(e)}")

    # Sin API key: filtra sobre MOCK_JOBS en memoria
    ...
```

Esto significa que el proyecto es demostrable de inmediato (sin registrarse en nada) y sigue funcionando si Jooble cambia su API o cae.

## Variables de entorno

```
# backend/.env (no hacer commit)
JOBBLE_API_KEY=tu_api_key_aqui
```

> **Nunca hagas commit de archivos `.env`** — añadirlos a `.gitignore`. En Render, la key se configura como variable de entorno del servicio, no en el repo.

## Despliegue: Render + Cloudflare Pages

El backend no necesita base de datos, así que el `render.yaml` es mínimo:

```yaml
services:
  - type: web
    name: job-board-api
    env: python
    plan: free
    rootDir: backend
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    healthCheckPath: /
    envVars:
      - key: JOBBLE_API_KEY
        sync: false
      - key: PYTHON_VERSION
        value: "3.11.9"
```

`PYTHON_VERSION` fijado explícitamente porque `pydantic==1.10.14` (pin necesario por compatibilidad con `fastapi==0.109.0`) no siempre tiene wheel precompilado para las versiones de Python más recientes que usa Render por defecto.

El frontend, al ser HTML/CSS/JS sin build, se despliega tal cual con `wrangler pages deploy frontend`.

### Keep-alive

Render duerme el free tier tras 15 min sin tráfico. Un GitHub Action con `cron: "*/12 * * * *"` hace ping a `/` cada 12 minutos, dejando margen para que el servicio nunca llegue a dormirse.

## ¿Por qué FastAPI en vez de Flask?

Para este proyecto, FastAPI encajó mejor que Flask:

- **Validación automática**: `pydantic` valida `JobSearchRequest` sin código extra.
- **Documentación gratis**: Swagger UI en `/docs` sin escribirla a mano.
- **Tipado**: los schemas (`models/schemas.py`) documentan la forma de los datos mejor que un dict suelto.

## Lecciones aprendidas

1. **Un fallback a datos mock vale más que un README que dice "necesitas una API key"**: el proyecto se puede probar en 10 segundos sin fricción.

2. **Fijar la versión de Python en el hosting no es opcional cuando usas paquetes con extensiones nativas**: `pydantic` v1 sin wheel precompilado para tu versión de Python intenta compilar en el build y puede fallar o tardar mucho.

3. **CORS abierto (`*`) está bien para APIs públicas de solo lectura**: no todo necesita una lista de orígenes permitidos, depende de qué expone la API.

---

*Job Board me enseñó el flujo completo de integrar una API externa con fallback, y a desplegar un backend Python sin base de datos en un hosting gratuito.*

> Más documentación en [mmoreno.dev](https://mmoreno.dev) → Proyectos.
