# Git básico

Guía de referencia rápida de los comandos Git más usados en el día a día.

## Configuración inicial

```bash
git config --global user.name "mmoreno-byte"
git config --global user.email "mdmorenoinfor@gmail.com"
```

## Flujo de trabajo básico

```bash
# 1. Ver el estado del repositorio
git status

# 2. Añadir cambios
git add .                    # todos los archivos
git add nombre-archivo.js    # un archivo concreto

# 3. Guardar los cambios
git commit -m "descripción del cambio"

# 4. Subir a GitHub
git push origin main
```

## Ramas

```bash
# Crear una rama nueva
git checkout -b nombre-rama

# Cambiar de rama
git checkout main

# Fusionar una rama
git merge nombre-rama

# Ver todas las ramas
git branch
```

## Deshacer cosas

```bash
# Deshacer cambios sin guardar
git restore nombre-archivo.js

# Volver al último commit
git reset --hard HEAD

# Ver historial de commits
git log --oneline
```

## Clonar un repositorio

```bash
git clone https://github.com/usuario/repositorio
cd repositorio
npm install
```

## Buenas prácticas

- Haz commits pequeños y frecuentes
- Escribe mensajes de commit descriptivos
- Trabaja siempre en ramas, no en main directamente
- Haz pull antes de push para evitar conflictos