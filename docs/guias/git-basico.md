# Git básico

Git es un sistema de control de versiones distribuido. Pero esta definición técnica no explica **por qué necesitas Git** en tu día a día como desarrollador.

## El problema que resuelve

Sin Git, cuando trabajas en un proyecto:

1. Empiezas a modificar archivos
2. De pronto no recuerdas qué cambiaste exactamente
3. Quieres probar algo nuevo pero no quieres perder lo que ya funciona
4. Un error nuevo aparece y no sabes en qué momento se introdujo
5. Si trabajas en equipo: ¿quién tiene la versión correcta? ¿Cómo fusionan dos personas sus cambios?

Git resuelve todo esto. Te permite guardar "capturas" de tu proyecto en momentos específicos, crear ramas paralelas para experimentar, y fusionar cambios de forma controlada.

## Configuración inicial

Antes de tu primer commit, configura tu identidad:

```bash
git config --global user.name "mmoreno-byte"
git config --global user.email "mdmorenoinfor@gmail.com"
```

Esta información acompañará a todos tus commits. Es tu firma en el historial del proyecto.

## El modelo de ramas

Imagina tu proyecto como una línea temporal con bifurcaciones:

```
main  ●───────────────────────────●───────────────────●
              ↖                  ↗              ↖
           feature/login    feature/dashboard      ↗
               ●─────────────●─────────────────●
```

**Rama `main`**: Código en producción, siempre estable.
**Ramas feature**: Trabajo en progreso, aisladas del código principal.

Este modelo te permite trabajar en varias funcionalidades simultáneamente sin interferir con el código que ya funciona.

## El flujo de trabajo básico

### 1. Crear una rama para trabajar

```bash
git checkout -b feature/mi-nueva-funcion
```

> **¿Por qué no trabajar directamente en `main`?**
> Si trabajas en `main` y cometes un error, afectas directamente el código en producción. Las ramas son como un espacio de pruebas personal que puedes abandonar sin consecuencias.

### 2. Ver qué has cambiado

```bash
git status
```

Te muestra qué archivos modificaste, cuáles están en staging (listos para commit) y cuáles son nuevos.

### 3. Añadir cambios al staging

```bash
git add nombre-archivo.js       # Un archivo específico
git add .                       # Todos los cambios
```

> **El staging es como una "zona de preparación"**
> No todo lo que cambiaste merece un commit. Usa `git add` para seleccionar exactamente qué cambios quieres incluir en el próximo commit. Esto mantiene tu historial limpio y los commits atómicos.

### 4. Guardar los cambios (commit)

```bash
git commit -m "feat(auth): añadir login con JWT"
```

> **¿Por qué el mensaje del commit importa?**
> Un buen mensaje de commit permite entender el historial del proyecto sin leer código. Sigue un formato:
> - `feat`: nueva funcionalidad
> - `fix`: corrección de bug
> - `docs`: documentación
> - `refactor`: restructuración sin cambiar funcionalidad
> - `test`: añadir o corregir tests

### 5. Subir a GitHub

```bash
git push origin feature/mi-nueva-funcion
```

> **Origen y main son convenciones**
> `origin` es el nombre por defecto de tu repositorio remoto. `main` es el nombre de la rama principal. Pueden llamarse diferente si tu equipo lo decide.

## Ramas: crear, cambiar, fusionar

### Crear y cambiar de rama

```bash
git checkout -b nueva-rama    # Crear y cambiar en un paso
git checkout main              # Volver a main
```

### Fusionar una rama

```bash
git checkout main
git merge nombre-rama
```

> **Merge vs Rebase: cuándo usar cada uno**
> - **Merge**: une el historial de dos ramas. Guarda la estructura original. Más seguro para trabajo en equipo.
> - **Rebase**: "replica" tus cambios encima de otra rama, creando un historial lineal. Más limpio visualmente pero hay que usarlo con cuidado en ramas compartidas.

## Deshacer cosas

Esta es la parte que más miedo da al principio, pero es importante entenderla.

### Deshacer cambios sin guardar

```bash
git restore nombre-archivo.js
```

Esto descarta los cambios en ese archivo específico y vuelve al último commit.

### Ver historial de commits

```bash
git log --oneline
```

Salida típica:
```
a1b2c3d fix: corregir validación de email
e4f5g6h feat: añadir login con JWT
i7j8k9l docs: actualizar README
```

### Volver a un commit anterior

```bash
git reset --hard HEAD~1    # Un commit atrás
git reset --hard a1b2c3d   # Ir a un commit específico por su hash
```

> **¡Cuidado con `git reset --hard`!**
> Los cambios que no estén commitados se perderán. Si ya hiciste commit pero quieres deshacerlo, puedes usar `git reflog` para encontrar el commit anterior y volver a él.

## Errores comunes y cómo resolverlos

### "Merge conflict"

Ocurre cuando Git no puede fusionar cambios automáticamente porque dos personas modificaron las mismas líneas de un archivo.

```
<<<<<<< HEAD
const user = 'María';
=======
const user = 'Ana';
>>>>>>> feature/nueva-funcion
```

**Solución**: Editar manualmente el archivo, decidir qué código queda, eliminar los marcadores (`<<<<<<<`, `=======`, `>>>>>>>`), hacer `git add` y `git commit`.

### "detached HEAD"

Significa que estás "flotando" fuera de cualquier rama, en un commit específico. Tus cambios no se perderán, pero no estarán en ninguna rama.

**Solución**: Crea una rama en ese punto:
```bash
git checkout -b mi-rama-de-rescate
```

### "¿Qué pasa si hago commit en la rama equivocada?"

```bash
git cherry-pick <hash-del-commit>
```

Esto copia un commit específico a tu rama actual.

## Clonar un repositorio

```bash
git clone https://github.com/usuario/repositorio
cd repositorio
npm install
```

El código se descarga y Git crea automáticamente una referencia a `origin`.

## Buenas prácticas

- **Commits pequeños y frecuentes**: un commit debe hacer una sola cosa. Si necesitas cambiar algo unrelated, hazlo en otro commit.
- **Mensajes descriptivos**: "fix bug" no dice nada. "fix: corregir validación de email cuando contiene números" lo dice todo.
- **Trabaja en ramas**: nunca directamente en `main`. Es tu red de seguridad.
- **Haz pull antes de push**: si hay conflictos, es mejor resolverlos localmente que subirlos y complicar a tu equipo.
- **Revisa qué vas a commitear**: usa `git diff --staged` antes de hacer commit para verificar exactamente qué incluirá.

## Comandos útiles para investigar

```bash
git diff                    # Ver cambios no staged
git diff --staged          # Ver cambios staged
git blame archivo.js       # Ver quién cambió cada línea
git stash                  # Guardar cambios temporalmente
git stash pop              # Recuperar cambios guardados
```

---

*Aprende Git como si enseñaras a un compañero: cuando puedas explicarlo claramente, es cuando realmente lo entiendes.*
