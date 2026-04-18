# Job Board

Filtrador de ofertas de trabajo en informática usando la API de Jooble. Proyecto simple que me enseñó a integrar APIs externas y manejar variables de entorno.

**Repositorio:** https://github.com/mmoreno-byte/job-board

## TL;DR

Backend Flask que consulta la API de Jooble, frontend HTML/CSS/JS vanilla. Aprendí a usar `python-dotenv` para gestionar API keys y a manejar respuestas de APIs externas.

## API Jooble

Jooble es un agregador de ofertas de empleo. Su API permite buscar ofertas:

```
POST https://es.jooble.org/api/[API_KEY]
{
  "keywords": "backend developer",
  "location": "Sevilla",
  "radius": 30
}
```

**Nota**: la API funciona con datos de demostración sin API key real, pero tiene límites.

## Backend: Flask

```python
# backend/main.py
from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
from dotenv import load_dotenv
import requests
import os

load_dotenv()

app = Flask(__name__)
CORS(app)

JOOBLE_API_KEY = os.getenv("JOOBLE_API_KEY", "demo")
JOOBLE_URL = "https://es.jooble.org/api/" + JOOBLE_API_KEY

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/jobs")
def search_jobs():
    keywords = request.args.get("keywords", "")
    location = request.args.get("location", "")

    payload = {
        "keywords": keywords,
        "location": location,
        "radius": 30
    }

    try:
        response = requests.post(JOOBLE_URL, json=payload, timeout=10)
        data = response.json()

        jobs = data.get("jobs", [])
        return jsonify({
            "total": data.get("totalCount", 0),
            "jobs": [{
                "title": job.get("title"),
                "company": job.get("company"),
                "location": job.get("location"),
                "snippet": job.get("snippet", "")[:200],
                "link": job.get("link")
            } for job in jobs]
        })
    except Exception as e:
        return jsonify({"error": str(e), "jobs": []}), 500

if __name__ == "__main__":
    app.run(debug=True)
```

## Variables de entorno con python-dotenv

```
# backend/.env (no hacer commit)
JOOBLE_API_KEY=tu_api_key_aqui
```

```python
from dotenv import load_dotenv
import os

load_dotenv()  # Carga .env automáticamente
api_key = os.getenv("JOOBLE_API_KEY")
```

> **Nunca hagas commit de archivos `.env`** — añadirlos a `.gitignore`. Las API keys son secretos.

## Frontend vanilla

```javascript
// frontend/app.js
const searchJobs = async () => {
  const keywords = document.getElementById('keywords').value;
  const location = document.getElementById('location').value;

  const response = await fetch(`/api/jobs?keywords=${keywords}&location=${location}`);
  const data = await response.json();

  const container = document.getElementById('results');
  container.innerHTML = data.jobs.map(job => `
    <div class="job-card">
      <h3>${job.title}</h3>
      <p><strong>${job.company}</strong> - ${job.location}</p>
      <p>${job.snippet}</p>
      <a href="${job.link}" target="_blank">Ver oferta</a>
    </div>
  `).join('');
};
```

## ¿Por qué Flask en vez de FastAPI?

Para este proyecto, Flask fue suficiente:

- **Rutas simples**: solo unos pocos endpoints
- **Sin validación compleja**: la API de Jooble ya valida el payload
- **Render template**: Flask tiene renderizado de templates integrado, útil para prototipos

FastAPI habría sido mejor si:
- Necesitara validación de datos con Pydantic
- Quisiera autodocumentación con Swagger
- El proyecto fuera a escalar mucho

## Estructura del proyecto

```
job-board/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── .env.example    # Template sin la key real
│   └── .env            # (no commitear)
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── .gitignore
└── README.md
```

## .gitignore

```
# Backend
venv/
.env

# Frontend
node_modules/
```

## Lecciones aprendidas

1. **python-dotenv es el estándar para vars de entorno local**: carga el `.env` al inicio y usa `os.getenv()` en vez de hardcodear.

2. **Las APIs externas pueden fallar**: siempre envolver requests en try/except. Los timeout también son importantes.

3. **Flask está bien para proyectos simples**: no necesitas FastAPI para todo. Conoce las herramientas y usa la correcta.

---

*Job Board me enseñó el flujo completo de integrar una API externa: desde el registro en Jooble hasta el deployment en Railway.*
