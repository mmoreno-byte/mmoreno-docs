# Entornos virtuales en Python

Guía para crear y gestionar entornos virtuales, tal como se usan
en las prácticas para aislar dependencias entre proyectos.

## Por qué usar entornos virtuales

Sin entorno virtual, todas las librerías se instalan de forma global
y pueden entrar en conflicto entre proyectos. Con un entorno virtual
cada proyecto tiene sus propias dependencias aisladas.

## Crear y activar

```bash
# Crear el entorno
python -m venv venv

# Activar en Windows
venv\Scripts\activate

# Activar en Mac/Linux
source venv/bin/activate

# Desactivar
deactivate
```

## Gestionar dependencias

```bash
# Instalar una librería
pip install requests

# Ver librerías instaladas
pip list

# Guardar dependencias
pip freeze > requirements.txt

# Instalar desde requirements.txt
pip install -r requirements.txt
```

## Estructura recomendada de un proyecto Python