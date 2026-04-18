# Git avanzado

Guía para comandos más allá del día a día. Git tiene herramientas poderosas que, aunque no uses constantemente, pueden salvarte cuando las necesitas.

## Rebase interactivo

`git rebase -i` te permite reescribir el historial de commits antes de hacer merge. Útil para limpiar commits pequeños o mal nombrados antes de compartirlos.

```bash
git rebase -i HEAD~3
```

Se abre un editor con los últimos 3 commits:

```
pick a1b2c3d feat: añadir login
pick e4f5g6h fix: algo roto
pick i7j8k9l docs: update readme

# Commands:
# p, pick = use commit
# r, reword = use commit, but edit the message
# s, squash = use commit, but meld into previous one
# f, fixup = like squash, but discard this commit's message
# d, drop = remove commit
```

**Combinar commits** (`squash`):
```
pick a1b2c3d feat: añadir login
squash e4f5g6h fix: algo roto
pick i7j8k9l docs: update readme
```

Esto combina los dos primeros commits en uno solo.

> **⚠️ Atención**: nunca hagas rebase de commits que ya están en una rama compartida (como `main`). Solo rebase en ramas tuyas.

## Git Bisect: encontrar el commit que rompió todo

Si tienes un bug que no sabes cuándo apareció, bisect hace búsqueda binaria en el historial:

```bash
git bisect start
git bisect bad HEAD                 # El commit actual tiene el bug
git bisect good a1b2c3d            # Este commit funcionaba bien
```

Git te lleva a un commit intermedio. Tests y decides si funciona o no:

```bash
git bisect good   # Si funciona, marca como "good"
git bisect bad    # Si no funciona, marca como "bad"
```

Git reduce el rango hasta encontrar el commit exacto. En ~10 pasos máximo.

```bash
git bisect reset   # Terminar y volver a HEAD
```

## Stash avanzado

`git stash` guarda cambios temporalmente sin commitearlos.

### Stash básico

```bash
git stash
git stash pop   # Recuperar cambios
```

### Stash con nombre

```bash
git stash push -m "WIP: login feature sin terminar"
git stash list   # Ver todos los stashes
```

### Stash parcial

Guardar solo algunos archivos o incluso líneas específicas dentro de un archivo:

```bash
git stash -p   # Modo interactivo: archivo por archivo, hunk por hunk
```

Te pregunta para cada cambio:
```
y - stash this hunk
n - don't stash this hunk
q - quit
```

### Crear rama desde un stash

```bash
git stash branch nueva-rama stash@{0}
```

## Reflog: recuperar commits "perdidos"

Hiciste `git reset --hard` y perdiste cambios? No todo está perdido.

```bash
git reflog
```

Salida:
```
a1b2c3d HEAD@{0}: reset: moving to HEAD~3
e4f5g6h HEAD@{1}: commit: feat: añadir login
i7j8k9l HEAD@{2}: checkout: moving to main
```

El commit sigue ahí, solo el puntero de HEAD se movió. Para recuperarlo:

```bash
git checkout e4f5g6h      # Ir al commit "perdido"
git checkout -b recover   # O crear una rama desde él
```

## Cherry-pick: aplicar un commit específico

Quieres un commit de otra rama, pero no quieres hacer merge de toda la rama:

```bash
git cherry-pick a1b2c3d
```

Esto aplica solo ese commit específico sobre tu rama actual.

Útil para:
- Recuperar un fix que hiciste en otra rama
- Aplicar hotfixes específicos sin afectar otros cambios

## Submódulos: cuándo (y cuándo no) usarlos

Los submódulos permiten tener un repositorio dentro de otro:

```bash
git submodule add https://github.com/usuario/biblioteca libs/biblioteca
```

**Cuándo usarlos**:
- Librerías externas que se actualizan independientemente
- Documentación que vive en su propio repo

**Cuándo NO usarlos**:
- Para dependencias de proyecto → usa un package manager (npm, pip, maven)
- Cuando los "submódulos" cambian constantemente → el overhead no vale la pena

Alternativas modernas:
- **npm/pip/maven** para código compilado
- **Monorepo** si necesitas mantener múltiples paquetes relacionados

## Comandos de diagnóstico

```bash
git blame archivo.js      # Ver quién cambió cada línea
git show a1b2c3d         # Ver el contenido de un commit
git log -p archivo.js    # Historial de cambios en un archivo
git gc                   # Limpiar objetos innecesarios
git fsck                 # Verificar integridad del repositorio
```

## Alias útiles

```bash
git config --global alias.st "status -s"
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.lg "log --oneline --graph --all"
```

Después:
```bash
git lg   # Ver historial visual
```

---

*Git avanzado no es sobre memorize más comandos—es sobre entender el modelo de objetos de Git para poder recover cuando algo sale mal.*
