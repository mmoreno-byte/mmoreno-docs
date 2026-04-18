# Python en prácticas

Scripts y automatizaciones desarrollados durante las prácticas profesionales en ANDWEBSOL SL. Python fue el lenguaje más usado por su simplicidad y la cantidad de librerías disponibles.

## TL;DR

Python brilla en automatización y desarrollo rápido de APIs. En prácticas desarrollé scripts de automatización, APIs REST con FastAPI/Flask, y aprendí que el aislamiento de dependencias con entornos virtuales no es opcional— es necesario.

## Lo que hice

- Desarrollo de scripts para automatización de tareas repetitivas
- Uso de entornos virtuales para aislar dependencias
- Diseño y desarrollo de APIs REST
- Implementación de APIs para comunicación entre servicios
- Documentación técnica de los scripts desarrollados

## Entornos virtuales (复习)

Ya lo cubro en la [guía de python-venv](/guias/python-venv), pero en la práctica:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Mac/Linux
# o
venv\Scripts\activate    # Windows
pip install -r requirements.txt
```

## APIs REST con FastAPI

FastAPI es mi elección para APIs nuevas en Python. Validación automática con Pydantic.

### Ejemplo: endpoint básico

```python
# main.py
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional

app = FastAPI()

class Item(BaseModel):
    name: str
    description: Optional[str] = None
    price: float

@app.get("/")
def read_root():
    return {"message": "API activa"}

@app.get("/items/{item_id}")
def read_item(item_id: int):
    return {"item_id": item_id, "name": "Sample Item"}

@app.post("/items")
def create_item(item: Item):
    return item
```

FastAPI valida automáticamente:
- `item_id` es entero (error 422 si no)
- `name` es string requerido
- `price` es float

### Ejemplo: subir y procesar archivo

```python
from fastapi import File, UploadFile
import pandas as pd
import io

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    contents = await file.read()

    if file.filename.endswith('.csv'):
        df = pd.read_csv(io.BytesIO(contents))
    else:
        df = pd.read_excel(io.BytesIO(contents))

    return {
        "rows": len(df),
        "columns": list(df.columns),
        "statistics": df.describe().to_dict()
    }
```

## APIs REST con Flask

Flask para proyectos más simples o cuando necesito más control.

### Ejemplo básico

```python
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})

@app.route("/api/data", methods=["GET"])
def get_data():
    return jsonify({"data": [1, 2, 3]})

@app.route("/api/data", methods=["POST"])
def post_data():
    data = request.json
    return jsonify({"received": data}), 201
```

### ¿Cuándo Flask vs FastAPI?

| Criterio | Flask | FastAPI |
|----------|-------|---------|
| Validación automática | No | Sí (Pydantic) |
| Auto-documentación | No | Sí (Swagger) |
| Proyectos pequeños | Sí | Sí |
| Proyectos con mucha validación | No | Sí |
| Control total del request/response | Sí | Limited |

## Automatización: casos de uso

### Script de procesamiento batch

```python
"""Procesar múltiples archivos CSV y generar reporte"""
import pandas as pd
from pathlib import Path
from datetime import datetime

def process_folder(folder_path: str) -> dict:
    results = []
    for csv_file in Path(folder_path).glob("*.csv"):
        df = pd.read_csv(csv_file)
        results.append({
            "file": csv_file.name,
            "rows": len(df),
            "columns": len(df.columns)
        })

    summary = pd.DataFrame(results)
    return {
        "total_files": len(results),
        "total_rows": summary["rows"].sum(),
        "generated_at": datetime.now().isoformat()
    }
```

### Manejo de errores

```python
import traceback

try:
    result = risky_operation()
except Exception as e:
    print(f"Error: {e}")
    print(traceback.format_exc())  # Log completo para debug
    raise  # Re-raise para que FastAPI devuelva 500
```

## Conceptos clave aprendidos

### Entornos virtuales

Permiten aislar las dependencias de cada proyecto evitando conflictos entre versiones de librerías. Imprescindible en proyectos profesionales.

### APIs REST

Interfaz que permite la comunicación entre servicios mediante HTTP. Desarrollé APIs para automatizar tareas y conectar sistemas distintos.

### Automatización

Uso de scripts para eliminar tareas manuales repetitivas, ahorrando tiempo y reduciendo errores humanos.

## Lecciones aprendidas

### Por qué FastAPI sobre Flask

Cuando empecé con Flask, me gustaba su simplicidad. Pero cuando necesitas validar datos de entrada (un campo requerido, un tipo específico), terminas escribiendo código manual.

FastAPI con Pydantic:

```python
# Mal en Flask (validación manual)
@app.route("/items", methods=["POST"])
def create_item():
    data = request.json
    if "name" not in data:
        return jsonify({"error": "name required"}), 400
    if not isinstance(data["price"], (int, float)):
        return jsonify({"error": "price must be number"}), 400

# Bien en FastAPI (validación automática)
@app.post("/items")
def create_item(item: Item):  # Pydantic valida automáticamente
    return item
```

### Manejo de archivos en memoria

Con App Engine (stateless), los archivos no persisten en disco. Todo en memoria:

```python
# Mal
with open("data.csv", "r") as f:
    df = pd.read_csv(f)

# Bien (funciona en App Engine)
contents = await file.read()
df = pd.read_csv(io.BytesIO(contents))
```

### Logging para debugging

```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.get("/api/data")
def get_data():
    logger.info("Fetching data")
    # ...
    logger.info(f"Returning {len(data)} items")
    return data
```

## Reflexión

Python ha sido el lenguaje que más he usado en las prácticas. Su simplicidad y la cantidad de librerías disponibles lo hacen ideal para automatización y desarrollo rápido de APIs. La comunidad es enorme: si necesitas algo, probablemente alguien ya lo resolvió.

---

*Python en prácticas me enseñó que la productividad importa. No necesitas la herramienta más compleja—necesitas la correcta para el trabajo.*
