# Conceptos API REST

Cómo funcionan las APIs REST en la práctica. Teoría mínima, ejemplos concretos basados en Videogames API.

## Qué es REST

REST (Representational State Transfer) es un estilo de arquitectura, no un protocolo. Se resume en:

- **Recursos**: todo es un recurso (usuarios, juegos, pedidos)
- **Verbos HTTP**: GET, POST, PUT, DELETE para interactuar con recursos
- **Stateless**: cada petición contiene toda la información necesaria

## Recursos y rutas

Un recurso se mapea a una ruta (URL):

| Recurso | Ruta base |
|--------|----------|
| Juegos | `/api/games` |
| Usuarios | `/api/users` |
| Auth | `/api/auth` |

## Verbos HTTP

```
GET    → Obtener recursos (no modifica nada)
POST   → Crear nuevos recursos
PUT    → Reemplazar recursos completamente
PATCH  → Modificar parcialmente un recurso
DELETE → Eliminar recursos
```

### Ejemplos prácticos con Videogames API

**Listar todos los juegos**
```bash
GET /api/games
```
```json
[
  {"id": 1, "title": "The Witcher 3", "genre": "RPG", "platform": "PC"},
  {"id": 2, "title": "Hades", "genre": "Roguelike", "platform": "Switch"}
]
```

**Obtener un juego específico**
```bash
GET /api/games/1
```
```json
{"id": 1, "title": "The Witcher 3", "genre": "RPG", "platform": "PC"}
```

**Crear un juego**
```bash
POST /api/games
Content-Type: application/json

{"title": "Stardew Valley", "genre": "Simulation", "platform": "PC"}
```
```json
{"id": 3, "title": "Stardew Valley", "genre": "Simulation", "platform": "PC"}
```

**Actualizar completamente**
```bash
PUT /api/games/3
Content-Type: application/json

{"title": "Stardew Valley", "genre": "Simulation", "platform": "PC, Switch"}
```

**Actualizar parcialmente**
```bash
PATCH /api/games/3
Content-Type: application/json

{"platform": "PC, Switch, PS5"}
```

**Eliminar**
```bash
DELETE /api/games/3
→ 204 No Content
```

## Códigos de estado HTTP

| Código | Significado | Cuándo usarlo |
|--------|-------------|--------------|
| 200 OK | Éxito | GET funciona, PUT/PATCH successful |
| 201 Created | Creado | POST crea un recurso nuevo |
| 204 No Content | Sin contenido | DELETE successful |
| 400 Bad Request | Error del cliente | Datos inválidos en la petición |
| 401 Unauthorized | No autenticado | Falta token o token inválido |
| 403 Forbidden | Prohibido | Autenticado pero sin permisos |
| 404 Not Found | No encontrado | El recurso no existe |
| 409 Conflict | Conflicto | Intentar crear algo que ya existe |
| 500 Internal Server Error | Error del servidor | Fallo inesperado |

### Ejemplos con códigos de error

**Intentar acceder sin auth**
```bash
GET /api/games
→ 401 Unauthorized
{"error": "Token requerido"}
```

**Recurso no encontrado**
```bash
GET /api/games/999
→ 404 Not Found
{"error": "Juego no encontrado"}
```

**Datos inválidos**
```bash
POST /api/games
{"title": ""}
→ 400 Bad Request
{"error": "El título es obligatorio"}
```

## Autenticación: Bearer tokens (JWT)

### El flujo

1. **Login**: usuario envía credenciales → servidor valida → devuelve token
2. **Peticiones protegidas**: cliente envía token en header `Authorization`
3. **Verificación**: servidor valida token → permite o rechaza

### Login

```bash
POST /api/auth/login
Content-Type: application/json

{"username": "demo", "password": "demo1234"}
```

Respuesta:
```json
{
  "token": "eyJhbGciOiJIUzM4NCJ9...",
  "type": "Bearer"
}
```

### Peticiones autenticadas

```bash
GET /api/games
Authorization: Bearer eyJhbGciOiJIUzM4NCJ9...
```

El servidor:
1. Extrae el token del header `Authorization`
2. Verifica la firma con la clave secreta
3. Decodifica el payload (username, exp, etc.)
4. Permite o rechaza

### Tokens vs Sesiones

| | Token (JWT) | Sesión |
|---|---|---|
| Almacenamiento | Cliente | Servidor |
| Escalabilidad | Stateless, escala fácil | Necesita store compartido |
| Seguridad | Firma criptográfica | Cookie con session ID |
| Invalidación | TTL (tiempo de vida) | Immediate (borra sesión) |

## API Keys

Más simple que JWT. Un string secreto que identifica al cliente:

```bash
GET /api/data?api_key=tu_api_key_aqui
```

O en header:
```bash
GET /api/data
X-API-Key: tu_api_key_aqui
```

**Diferencia con JWT**: la API key es un identificador, no lleva información codificada. El servidor tiene que buscar qué cliente pertenece a esa key.

## Validación de datos

El servidor debe validar todo lo que recibe:

```python
# FastAPI example
from pydantic import BaseModel

class GameCreate(BaseModel):
    title: str              # Requerido
    genre: str | None = None
    platform: str | None = None
    releaseYear: int | None = None
    rating: float | None = None

@app.post("/api/games")
def create_game(game: GameCreate):
    # FastAPI valida automáticamente:
    # - title existe y es string
    # - rating es float o None
    # - Si hay error → 422 Unprocessable Entity
    return game
```

## Versionado de APIs

¿Cuando cambiar la estructura de tu API sin romper clientes existentes?

**Opción 1: URL path**
```
/api/v1/games
/api/v2/games
```

**Opción 2: Header**
```
Accept: application/vnd.api.v2+json
```

**Opción 3: Query param** (no recomendado)
```
/api/games?version=2
```

---

*Entender REST es entender que cada endpoint es un recurso con operaciones predecibles. Una vez que internalizas esto, diseñar APIs se vuelve natural.*
