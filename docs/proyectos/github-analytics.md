# GitHub Analytics

Herramienta de análisis de repositorios de GitHub para descubrir tendencias del mercado tech. Analiza lenguajes más usados, frameworks populares, y patrones en proyectos españoles.

**Repositorio:** https://github.com/mmoreno-byte/github-analytics

## TL;DR

Backend Flask que consulta la API pública de GitHub, procesa los datos con Pandas, y devuelve análisis. Frontend vanilla HTML/CSS/JS para visualizar los resultados. Proyecto simple donde aprendí a consumir APIs externas.

## Arquitectura

```
┌─────────────────┐         ┌────────────────────┐
│  Frontend       │         │  GitHub REST API   │
│  (HTML/JS)     │ ──────▶ │  (sin auth)       │
│  Visualización │ ◀────── │                    │
└─────────────────┘  JSON  └────────────────────┘
        ▲
        │
   ┌────┴────┐
   │ Flask   │
   │ Backend │
   │ + Pandas│
   └─────────┘
```

## API GitHub REST vs GraphQL

GitHub ofrece dos APIs:

- **REST**: más simple, ideal para consultas puntuales
- **GraphQL**: más flexible, pero requiere aprender el lenguaje de queries

Para este proyecto, REST fue suficiente. La API pública permite **60 peticiones por hora** sin autenticación.

## Backend: Flask + Pandas

```python
# backend/main.py
from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
import pandas as pd
from datetime import datetime

app = Flask(__name__)
CORS(app)

GITHUB_API = "https://api.github.com"

@app.route("/api/analyze")
def analyze_repo():
    owner = request.args.get("owner")
    repo = request.args.get("repo")

    # Obtener datos del repositorio
    url = f"{GITHUB_API}/repos/{owner}/{repo}"
    response = requests.get(url)

    if response.status_code != 200:
        return jsonify({"error": "Repositorio no encontrado"}), 404

    data = response.json()

    return jsonify({
        "name": data["name"],
        "language": data["language"],
        "stars": data["stargazers_count"],
        "forks": data["forks_count"],
        "description": data["description"],
        "created_at": data["created_at"]
    })

@app.route("/api/trends")
def trends():
    # Analizar repositorios trending de España
    url = f"{GITHUB_API}/search/repositories"
    params = {
        "q": "language:python location:spain created:>2023-01-01",
        "sort": "stars",
        "order": "desc"
    }
    response = requests.get(url, params=params)
    repos = response.json()["items"]

    # Procesar con Pandas
    df = pd.DataFrame([{
        "name": r["name"],
        "stars": r["stargazers_count"],
        "language": r["language"]
    } for r in repos[:50]])

    return jsonify({
        "total_repos": len(df),
        "top_languages": df["language"].value_counts().head(10).to_dict(),
        "avg_stars": df["stars"].mean()
    })
```

## Frontend vanilla: ¿por qué no React?

Este proyecto fue mi primera vez con HTML/CSS/JS vanilla después de React. Algunas reflexiones:

**React sería overkill para:**
- Una sola página
- Sin estado complejo
- Sin muchas interacciones

**Vanilla JS es suficiente para:**
- Fetch API → DOM manipulation
- Pocos elementos interactivos
- Prototipos rápidos

```javascript
// app.js
const analyzeRepo = async () => {
  const owner = document.getElementById('owner').value;
  const repo = document.getElementById('repo').value;

  const response = await fetch(`/api/analyze?owner=${owner}&repo=${repo}`);
  const data = await response.json();

  document.getElementById('result').innerHTML = `
    <p><strong>${data.name}</strong></p>
    <p>⭐ ${data.stars} stars</p>
    <p>🐱 ${data.language || 'N/A'}</p>
  `;
};
```

## Limitaciones de la API pública

La API de GitHub sin autenticación tiene rate limit bajo. El header indica cuántas peticiones te quedan:

```
X-RateLimit-Remaining: 57
X-RateLimit-Reset: 1703123456
```

## Lecciones aprendidas

1. **La API pública de GitHub es suficiente para prototipos**: no necesitas API key para explorar. Para producción, necesitarías autenticación para aumentar el rate limit.

2. **Pandas simplifica el análisis**: aunque sean 50 repositorios, `value_counts()` te ahorra escribir un bucle con contador manual.

3. **Vanilla JS está bien para proyectos simples**: no todo necesita React. A veces simpler es mejor.

---

*GitHub Analytics fue mi primer proyecto de "análisis de datos reales" y me enseñó que Pandas no es solo para data science—it también simplifica análisis sencillo.*
