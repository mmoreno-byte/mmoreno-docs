# Entornos virtuales en Python

Los entornos virtuales son una de esas herramientas que parecen opcionales hasta que trabajas en varios proyectos Python simultáneamente y las dependencias empiezan a entrar en conflicto.

## El problema real que resuelven

Imagina que tienes dos proyectos:

- **Proyecto A** necesita `requests==2.28.0`
- **Proyecto B** necesita `requests==2.31.0`

Si instalas las librerías globalmente (en el sistema), solo puedes tener una versión instalada. Cuando cambias de proyecto, tienes que desinstalar y reinstallar. En proyectos profesionales esto es inviable.

Un entorno virtual crea una instalación Python **aislada** por proyecto. Cada proyecto tiene sus propias dependencias independientes.

## Crear y activar

```bash
# Crear el entorno virtual
python -m venv venv
```

El segundo `venv` es el nombre de la carpeta donde se creará. Podrías llamarlo diferente (por ejemplo `.env`), pero `venv` es la convención más extendida.

### Activar en Windows

```bash
venv\Scripts\activate
```

### Activar en Mac/Linux

```bash
source venv/bin/activate
```

### Desactivar

```bash
deactivate
```

Cuando ves `(venv)` al inicio de tu terminal, significa que el entorno está activo. Todas las operaciones de Python y pip afectarán solo a ese entorno.

## Gestionar dependencias

### Instalar una librería

```bash
pip install requests
```

### Ver librerías instaladas

```bash
pip list
```

Salida típica:
```
Package    Version
---------- -------
requests   2.31.0
flask      3.0.0
python-dotenv 1.0.0
```

### Guardar las dependencias del proyecto

```bash
pip freeze > requirements.txt
```

El archivo `requirements.txt` ahora contiene todas las librerías con sus versiones exactas. Esto permite que cualquier persona pueda replicar tu entorno con:

```bash
pip install -r requirements.txt
```

### Alternativas a `pip freeze`

`pip freeze` lista **todas** las dependencias, incluyendo las transitivas (librerías que tus librerías necesitan). Esto puede ser overkill.

**`pipreqs`**: solo las dependencias que tu código realmente usa:
```bash
pip install pipreqs
pipreqs ./proyecto
```

**`poetry`**: gestión moderna de dependencias con `pyproject.toml`:
```bash
pip install poetry
poetry add requests
```

## Estructura recomendada de un proyecto Python

```
mi-proyecto/
├── venv/                    # Entorno virtual (no hacer commit)
├── src/
│   └── mi_paquete/          # Tu código como paquete
│       ├── __init__.py
│       └── main.py
├── tests/
│   └── test_main.py
├── requirements.txt         # Dependencias
├── requirements-dev.txt     # Dependencias de desarrollo
└── README.md
```

### ¿Por qué `src/`?

Separar el código de la raíz permite que el proyecto se importe correctamente como paquete:

```python
from mi_paquete import main
```

Sin la carpeta `src/`, podrías tener problemas de imports cuando alguien instale tu paquete con `pip install`.

## Ejemplo práctico: crear un script desde cero

```bash
# 1. Crear proyecto y entrar
mkdir mi-script && cd mi-script

# 2. Crear entorno virtual
python -m venv venv

# 3. Activar
venv\Scripts\activate   # Windows
# source venv/bin/activate  # Mac/Linux

# 4. Instalar dependencias
pip install requests python-dotenv

# 5. Guardar dependencias
pip freeze > requirements.txt

# 6. Crear estructura
mkdir src && touch src/__init__.py

# 7. Crear script
cat > src/main.py << 'EOF'
import requests
from dotenv import load_dotenv
import os

load_dotenv()

def fetch_data(url):
    response = requests.get(url)
    return response.json()

if __name__ == "__main__":
    data = fetch_data("https://api.github.com/users/mmoreno-byte")
    print(f"Nombre: {data['name']}")
EOF
```

## Integración con VSCode

1. Instala la extensión **Python** (Microsoft)
2. Abre la paleta de comandos (`Ctrl+Shift+P`)
3. Busca **Python: Select Interpreter**
4. Selecciona el Python dentro de `venv/Scripts/python.exe` (Windows) o `venv/bin/python` (Mac/Linux)

Ahora, al ejecutar código o abrir la terminal integrada, VSCode usará automáticamente el entorno virtual correcto.

## Buenas prácticas

1. **Nunca hagas commit de `venv/`** — añade `venv/` a `.gitignore`
2. **Sempre usa entorno virtual** — aunque sea un script de una línea
3. **Documenta las versiones** — `requirements.txt` o `pyproject.toml` es tu fuente de verdad
4. **Separa dependencias de desarrollo** — `requirements-dev.txt` para herramientas de testing como `pytest`

## Entornos virtuales en el contexto de FastAPI/Flask

Cuando trabajas con frameworks como FastAPI o Flask, el patrón típico es:

```bash
# Backend del proyecto
cd backend
python -m venv venv
source venv/bin/activate
pip install fastapi uvicorn pandas
pip freeze > requirements.txt
```

El frontend y el backend son proyectos separados con sus propios entornos virtuales.

---

*Los entornos virtuales son como el aislamiento de proyectos en un IDE: al principio parecen trabajo extra, pero cuando descubres que no puedes vivir sin ellos, entiendes por qué son el estándar.*
