# Despliegue en Google Cloud

Cómo desplegué Data Dashboard en Google Cloud App Engine. Guía paso a paso basada en mi experiencia real.

## Google Cloud: servicios relevantes

| Servicio | Tipo | Cuándo usarlo |
|----------|------|--------------|
| **App Engine** | PaaS | Apps web simples, scaling automático |
| **Cloud Functions** | FaaS | Funciones serverless, eventos |
| **Compute Engine** | IaaS | Máquinas virtuales, control total |
| **Cloud Run** | Contenedores | Containers en serverless |
| **Kubernetes Engine** | CaaS | Orquestación de contenedores |

**Elegí App Engine** porque:
- No quiero gestionar servidores
- Scaling automático incluido
- Fácil deployment con `gcloud`

## 1. Crear proyecto en Google Cloud Console

### GUI (consola web)

1. Ve a [console.cloud.google.com](https://console.cloud.google.com)
2. Crea nuevo proyecto: `data-dashboard-mmoreno`
3. Anota el **Project ID**

### CLI (gcloud)

```bash
gcloud projects create data-dashboard-mmoreno --name="Data Dashboard"
gcloud config set project data-dashboard-mmoreno
```

## 2. Habilitar App Engine

```bash
gcloud app create --region=us-central1
```

> **Elegir región**: afecta latencia. Para España, `europe-west1` o `us-central1` si no hay opción europea.

## 3. Configurar app.yaml

```yaml
# backend/app.yaml
runtime: python312
entrypoint: gunicorn -b :$PORT main:app

env_variables:
  ENV: production

automatic_scaling:
  min_instances: 1
  max_instances: 10
```

`$PORT` es Provided por App Engine—tu app debe escuchar en esa variable.

## 4. Desplegar

```bash
gcloud app deploy
```

Tiempo típico: 2-5 minutos.

```bash
# Ver el estado
gcloud app describe

# Abrir en navegador
gcloud app browse
```

## 5. Configurar variables de entorno

### Desde CLI

```bash
gcloud app services set-env-vars DATA_API_KEY=tu-key --service=backend
```

### Desde GitHub Actions

```yaml
- name: Deploy to Google Cloud
  run: |
    echo ${{ secrets.GCP_SA_KEY }} | base64 -d > key.json
    gcloud auth activate-service-account --key-file=key.json
    gcloud app deploy
```

## Secrets en GitHub

1. Ve a GitHub → Settings → Secrets and variables → Actions
2. Añade `GCP_SA_KEY` con el contenido del service account key (base64 encoded)

```bash
# Crear service account
gcloud iam service-accounts create deployer --display-name="Deployer"

# Asignar rol
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:deployer@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/appengine.deployer"

# Crear key y codificar
gcloud iam service-accounts keys create key.json \
  --iam-account=deployer@$PROJECT_ID.iam.gserviceaccount.com
base64 key.json | tr -d '\n'  # Copiar este valor a GitHub Secret
```

## Errores comunes

### "Permission denied" al deploy

```bash
gcloud auth login
gcloud auth configure-docker
```

### Region incorrecta

```
Error: The region us-central1 is not a valid region.
```

Solución: verificar la región válida:
```bash
gcloud app regions list
```

### App Engine vs Cloud Run vs Compute Engine

| Característica | App Engine | Cloud Run | Compute Engine |
|---|---|---|---|
| Servidores | Gestionados | Gestionados | Tú los gestionas |
| Scaling | Automático | Automático | Manual |
| Contenedores | No | Sí | No |
| Precio | Por instancia | Por request | Por hora |

## Monitorización básica

```bash
# Ver logs
gcloud app logs read --service=default

# Logs en tiempo real
gcloud app logs tail
```

## Después del deploy: Cloud Run

Si quieres container-based deployment (ej: FastAPI en Docker):

```bash
# Construir y empujar a Artifact Registry
gcloud builds submit --tag gcr.io/$PROJECT_ID/data-dashboard

# Desplegar
gcloud run deploy data-dashboard --image gcr.io/$PROJECT_ID/data-dashboard --platform managed
```

## Lecciones aprendidas

1. **App Engine Standard es más barato que Flexible** para proyectos pequeños. Standard usa instancias pre-pagadas, Flexible es más flexible (valga la redundancia) pero más caro.

2. **El scaling automático es impresionante**: si tu app tiene mucho tráfico de golpe, App Engine crea instancias adicionales automáticamente. No tienes que preocuparte por capacidad.

3. **Google Cloud tiene banyak productos**: no intentes usar todo. Aprende App Engine primero, luego expande a Cloud Functions o Cloud Run si los necesitas.

---

*Desplegar en Google Cloud me enseñó que la nube no es magia—son servidores gestionados. Entender qué servicio usar para qué caso es medio trabajo.*
