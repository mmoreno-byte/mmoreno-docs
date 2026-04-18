# Data Dashboard

Aplicación web para análisis de datos: sube un CSV o Excel y obtén estadísticas descriptivas y gráficos interactivos al instante.

**URL en vivo:** https://mmoreno-data-dashboard.oa.r.appspot.com/

## TL;DR

Aplicación full-stack con React/Vite/Recharts en el frontend y Python/FastAPI/Pandas en el backend. Desplegada en Google Cloud App Engine. El escollo principal fue entender que App Engine no permite sistema de archivos permanente.

## Arquitectura

```
┌─────────────────────┐         ┌─────────────────────────────┐
│   React Frontend    │         │   Google Cloud App Engine    │
│   (Vite + Recharts) │ ──────▶ │   Python/FastAPI/Pandas      │
│   Subida de CSV     │ ◀────── │   Procesamiento de datos     │
└─────────────────────┘  JSON   └─────────────────────────────┘
```

El usuario sube un archivo CSV/Excel → se envía al backend → Pandas procesa → devuelve estadísticas y gráficos.

## Decisiones técnicas

### ¿Por qué Pandas?

Pandas es la librería estándar para manipulación de datos en Python por una razón:

```python
import pandas as pd

df = pd.read_csv('datos.csv')

# Estadísticas descriptivas de una línea
df.describe()

# Operaciones vectorizadas (rápido)
df['ingresos'].mean()
df[df['ciudad'] == 'Sevilla']['ventas'].sum()
```

Sin Pandas, tendrías que escribir código manual para calcular medias, medianas, desviaciones estándar... Con Pandas, está listo.

### ¿Por qué FastAPI sobre Flask?

FastAPI ofrece **validación automática** de datos con Pydantic:

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class DataUpload(BaseModel):
    format: str  # "csv" o "excel"
    columns: list[str]

@app.post("/analyze")
def analyze(file: UploadFile, options: DataUpload):
    # FastAPI valida que el request tiene el formato correcto
    # ...
```

Con Flask, tendrías que validar manualmente cada campo. FastAPI lo hace solo.

### ¿Por qué Google Cloud App Engine?

App Engine es **Platform as a Service (PaaS)**: no tienes que gestionar servidores, scaling automático incluido. Para un proyecto académico, es suficiente.

## Backend: FastAPI + Pandas

```python
# backend/main.py
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar origen
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/analyze")
async def analyze(file: UploadFile = File(...)):
    contents = await file.read()
    df = pd.read_csv(io.BytesIO(contents)) if file.filename.endswith('.csv') else pd.read_excel(io.BytesIO(contents))

    return {
        "columns": df.columns.tolist(),
        "rows": len(df),
        "statistics": df.describe().to_dict(),
        "numeric_columns": df.select_dtypes(include=['number']).columns.tolist()
    }
```

## Frontend: React + Recharts

```jsx
// App.jsx
const [data, setData] = useState(null);

const handleFileUpload = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/api/analyze`, {
    method: 'POST',
    body: formData,
  });
  const result = await response.json();
  setData(result);
};

return (
  <div>
    <FileUpload onUpload={handleFileUpload} />
    {data && (
      <>
        <Statistics data={data.statistics} />
        <Charts data={data} />
      </>
    )}
  </div>
);
```

### Gráficos con Recharts

```jsx
<ResponsiveContainer width="100%" height={300}>
  <BarChart data={chartData}>
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    <Bar dataKey="value" fill="#8884d8" />
  </BarChart>
</ResponsiveContainer>
```

## El problema: App Engine no permite sistema de archivos permanente

Este fue el descubrimiento más importante durante el despliegue.

App Engine es **stateless**: cuando tu aplicación no está procesando una petición, Google puede apagar la instancia. Esto significa que **no hay sistema de archivos permanente**. Si guardas un archivo en disco, desaparece.

**Solución**: procesar todo en memoria.

```python
# Mal (no funciona en App Engine)
with open('uploaded_file.csv', 'r') as f:
    df = pd.read_csv(f)

# Bien (funciona en App Engine)
contents = await file.read()
df = pd.read_csv(io.BytesIO(contents))  # Todo en memoria
```

## Despliegue en Google Cloud

### 1. Crear proyecto en Google Cloud Console

```bash
gcloud projects create data-dashboard-mmoreno --name="Data Dashboard"
gcloud config set project data-dashboard-mmoreno
```

### 2. Configurar app.yaml

```yaml
# backend/app.yaml
runtime: python312
entrypoint: gunicorn -b :$PORT main:app

env_variables:
  INSTANCE_CONNECTION_NAME: "data-dashboard:us-central1:data-dashboard-db"
  GOOGLE_APPLICATION_CREDENTIALS: "key.json"
```

### 3. Desplegar

```bash
gcloud app deploy
```

### 4. Configurar secrets en GitHub

En GitHub Actions, para no hardcodear credenciales:

```yaml
- name: Deploy to Google Cloud
  env:
    GCP_SA_KEY: ${{ secrets.GCP_SA_KEY }}
  run: |
    echo $GCP_SA_KEY | base64 -d > key.json
    gcloud auth activate-service-account --key-file=key.json
    gcloud app deploy
```

## Límites de App Engine

- **32MB por request**: archivos grandes no caben. Para análisis de datasets grandes, necesitarías otro servicio (Cloud Storage + Cloud Functions).
- **Tiempo de respuesta**: 60 segundos máximo. Si el procesamiento es muy lento,-App Engine mata la conexión.

## Lecciones aprendidas

1. **App Engine es stateless**: todo en memoria, nada en disco. Si vienes de hosting tradicional (donde puedes escribir archivos), esto es un cambio mental.

2. **Pandas + FastAPI = producción rápida**: validates datos con Pydantic, procesas con Pandas, devuelves JSON. El stack es sorprendentemente poderoso para APIs de datos.

3. **Google Cloud tiene banyak servicios diferentes**: App Engine vs Cloud Functions vs Compute Engine vs Kubernetes. Elegir el correcto es medio trabajo.

---

*Data Dashboard me enseñó que el backend no es solo "devolver datos"—es entender constraints de producción como memoria, tiempo de respuesta, y escalabilidad.*
