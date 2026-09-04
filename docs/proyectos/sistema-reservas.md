# Sistema de Reservas

API REST para gestionar reservas de espacios de un coworking (puestos, salas de reunión, oficinas privadas). Construida con FastAPI + SQLAlchemy + PostgreSQL, con autenticación JWT y roles admin/cliente.

**Repositorio:** https://github.com/mmoreno-byte/sistema-reservas
**URL en producción:** https://sistema-reservas-wub2.onrender.com
**Docs Swagger:** https://sistema-reservas-wub2.onrender.com/docs

## TL;DR

Backend FastAPI desplegado en Render con base de datos PostgreSQL en Neon, migraciones vía Alembic y tests con pytest (base SQLite en memoria, independiente de la BD real). El primer usuario que se registra se convierte automáticamente en admin. Valida solapes de horario al crear una reserva.

## Arquitectura

```
┌─────────────┐     HTTP/JWT      ┌──────────────────────────┐
│   Cliente   │ ────────────────▶ │   Render (FastAPI)        │
│  (API REST) │ ◀──────────────── │   Python 3.11 + Alembic   │
└─────────────┘                   └──────────────────────────┘
                                        │
                                        ▼
                          PostgreSQL en Neon (instancia
                          compartida con Videogames API,
                          esquema propio "sistema_reservas")
```

## Modelo de datos

```python
# app/models.py
class UserRole(str, enum.Enum):
    admin = "admin"
    client = "client"

class ResourceType(str, enum.Enum):
    desk = "desk"
    meeting_room = "meeting_room"
    private_office = "private_office"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.client, nullable=False)

class Resource(Base):
    __tablename__ = "resources"
    id = Column(Integer, primary_key=True)
    type = Column(Enum(ResourceType), nullable=False)
    capacity = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)

class Reservation(Base):
    __tablename__ = "reservations"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    resource_id = Column(Integer, ForeignKey("resources.id"), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    status = Column(Enum(ReservationStatus), default=ReservationStatus.confirmed, nullable=False)
```

## Endpoints principales

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/auth/register` | Registrar usuario (el primero = admin) | No |
| POST | `/auth/login` | Login, devuelve JWT | No |
| GET | `/auth/me` | Usuario autenticado actual | Sí |
| GET / POST | `/resources` | Listar / crear recursos | Sí (crear = admin) |
| GET / PUT / DELETE | `/resources/{id}` | Detalle / editar / desactivar | Sí (admin) |
| POST | `/reservations` | Crear reserva (valida solapes) | Sí |
| GET | `/reservations/me` | Mis reservas | Sí |
| GET | `/reservations` | Todas las reservas | Sí (admin) |
| PATCH | `/reservations/{id}/cancel` | Cancelar reserva | Sí |

## Validación de solapes de horario

Antes de crear una reserva, se comprueba que no exista otra reserva confirmada para el mismo recurso cuyo rango de horas se solape:

```python
overlapping = (
    db.query(models.Reservation)
    .filter(
        models.Reservation.resource_id == payload.resource_id,
        models.Reservation.status == models.ReservationStatus.confirmed,
        models.Reservation.start_time < payload.end_time,
        models.Reservation.end_time > payload.start_time,
    )
    .first()
)
```

También se rechaza cualquier reserva cuyo `start_time` ya haya pasado.

## Despliegue: Render + Neon, compartiendo Postgres con otro proyecto

El backend corre en Render (Python), pero la base de datos vive en Neon — el mismo proyecto Neon que usa [Videogames API](/proyectos/videogames-api). En vez de pagar por una segunda base, `sistema-reservas` reutiliza esa misma Postgres pero **aislada en su propio esquema** (`sistema_reservas`), para no chocar con las tablas de `videogames-api`:

```yaml
# render.yaml
envVars:
  - key: DATABASE_URL
    sync: false
  - key: PYTHON_VERSION
    value: "3.11.9"
```

`DATABASE_URL` no se guarda en el repo (`sync: false`): se pega a mano en el dashboard de Render con la cadena de conexión de Neon. *(Al principio esta base vivía en el Postgres gratuito de Render, compartido con `videogames-db` vía `fromDatabase`; se migró a Neon en septiembre 2026 junto con Videogames API, por la misma razón: el Postgres free de Render caduca a los 30 días.)*

```python
# app/database.py
DB_SCHEMA = "sistema_reservas"

if settings.database_url.startswith("postgresql"):
    with engine.connect() as conn:
        conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {DB_SCHEMA}"))
        conn.commit()
    engine = engine.execution_options(schema_translate_map={None: DB_SCHEMA})
```

`schema_translate_map` redirige de forma transparente todas las tablas sin esquema explícito (`schema=None`) al esquema `sistema_reservas`, tanto en el motor de SQLAlchemy como en el `env.py` de Alembic (con `version_table_schema` para que el propio historial de migraciones también viva ahí).

`PYTHON_VERSION` fijado explícitamente: Render usa Python 3.14 por defecto, y `psycopg2-binary` no tenía wheel precompilado compatible (`ImportError: undefined symbol _PyInterpreterState_Get`) — mismo tipo de problema ya visto en [Job Board](/proyectos/job-board).

## Lecciones aprendidas

1. **El límite de "1 BD gratis por cuenta" en un hosting no siempre significa "1 base de datos"**: un esquema de Postgres separado dentro de la misma instancia logra el mismo aislamiento lógico sin coste extra.

2. **`schema_translate_map` es más limpio que tocar `search_path` a mano**: no hay que añadir `schema=` a cada modelo ni tocar cada migración; se centraliza en un solo punto al crear el engine.

3. **Fijar la versión de Python del hosting sigue siendo necesario**: cada proyecto Python nuevo en Render ha repetido este mismo fallo hasta que se fija `PYTHON_VERSION` explícitamente.

---

*Sistema de Reservas me enseñó a compartir infraestructura gratuita entre proyectos sin que se pisen entre sí, y a depurar fallos de compatibilidad de wheels de Python en producción.*

> Más documentación en [mmoreno.dev](https://mmoreno.dev) → Proyectos.
