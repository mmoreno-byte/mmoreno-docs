# Docker fundamentos

Docker permite crear, desplegar y ejecutar aplicaciones en contenedores—aíslados del sistema operativo. Cada contenedor tiene su propio sistema de archivos, librerías, y dependencias.

## Conceptos básicos

### Imagen vs Contenedor

- **Imagen**: plantilla read-only para crear contenedores. Como una clase en OOP.
- **Contenedor**: instancia ejecutándose de una imagen. Como un objeto en OOP.

### Registry

Lugar donde se almacenan imágenes Docker. El más común es **Docker Hub** (docker.io). Puedes usar otros (Google Container Registry, GitHub Packages, etc.).

## Comandos esenciales

### Imágenes

```bash
docker images                    # Ver imágenes descargadas
docker pull ubuntu:22.04        # Descargar imagen
docker rmi ubuntu:22.04         # Eliminar imagen
```

### Contenedores

```bash
docker ps                        # Contenedores ejecutándose
docker ps -a                     # Todos los contenedores (incluidos parados)
docker run -it ubuntu:22.04      # Crear y ejecutar contenedor interactivo
docker start mi-contenedor        # Iniciar contenedor parado
docker stop mi-contenedor         # Parar contenedor
docker rm mi-contenedor           # Eliminar contenedor
```

### flags comunes

```bash
docker run -d                    # Modo detached (en segundo plano)
docker run -p 8080:80             # Mapear puerto host:contenedor
docker run -v /data:/data         # Montar volumen host:contenedor
docker run --name mi-app          # Nombrar el contenedor
```

## Dockerfile

Archivo de instrucciones para construir una imagen.

### Ejemplo: Videogames API (Java 21)

```dockerfile
# Usar imagen oficial de Java con Alpine (ligero)
FROM eclipse-temurin:21-jdk-alpine

# Directorio de trabajo
WORKDIR /app

# Copiar el JAR compilado
COPY target/*.jar app.jar

# Exponer puerto
EXPOSE 8080

# Comando inicial
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### Ejemplo: FastAPI (Python)

```dockerfile
FROM python:3.12-slim

WORKDIR /app

# Copiar requirements primero (mejor caché)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código
COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Buenas prácticas

**Orden de capas importa**: Docker reconstruye desde la capa que cambió. Copiar `requirements.txt` antes que el código permite caché:

```dockerfile
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .   # Este cambio no invalida el caché de pip
```

**Usar imágenes oficiales pequeñas**: `alpine` vs `ubuntu` vs `debian`.

## Docker Compose

Para aplicaciones con múltiples contenedores (ej: app + base de datos).

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=postgresql://db:5432/mydb
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=mydb
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=secret
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

```bash
docker-compose up -d    # Crear e iniciar
docker-compose down   # Parar y eliminar
docker-compose logs   # Ver logs
docker-compose exec db psql -U user -d mydb  # Conectar a DB
```

## Concepto de capas

Cada instrucción en Dockerfile crea una capa (layer):

```dockerfile
FROM ubuntu:22.04          # Capa 1: imagen base
RUN apt-get update          # Capa 2
RUN apt-get install -y git # Capa 3
COPY . /app                 # Capa 4
```

Docker reutiliza capas entre imágenes si no cambiaron. Por eso copiar `requirements.txt` antes que el código fuente aprovecha el caché.

## Desarrollo local con Docker

### Mi flujo para proyectos Python/Flask

```bash
# 1. Crear Dockerfile en backend/
# 2. docker-compose.yml
# 3. Levantar
docker-compose up --build

# 4. Ver logs
docker-compose logs -f backend

# 5. Debug: entrar al contenedor
docker-compose exec backend bash
```

### Volúmenes para desarrollo

```yaml
services:
  backend:
    build: .
    volumes:
      - ./backend:/app       # Sincroniza cambios en tiempo real
    command: uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Con `--reload`, Flask recarga cuando cambias el código.

## Ejemplo real: Videogames API en Railway

Railway puede desplegar desde un Dockerfile:

```dockerfile
FROM eclipse-temurin:21-jdk-alpine
WORKDIR /app
COPY target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

Railway detecta el Dockerfile, construye la imagen, y despliega el contenedor.

## Comandos de limpieza

```bash
docker system prune          # Eliminar todo lo no usado
docker image prune -a        # Eliminar imágenes sin usar
docker container prune      # Eliminar contenedores parados
```

## Cuándo usar Docker

**Sí:**
- Desplegar en producción ( Railway, Render, Fly.io)
- Entorno de desarrollo consistente (todos usan la misma imagen)
- Microservicios (base de datos separada de la app)
- CI/CD (mismo entorno en pipeline que en producción)

**No:**
- Proyecto simple de una sola página → overkill
- Cuando el hosting no lo soporta (GitHub Pages no tiene Docker)

---

*Docker parece complicado al principio, pero su modelo es simple: imágenes capas, contenedores instancias, compose multi-contenedor. Una vez que lo internalizas, desplegar deja de dar miedo.*
