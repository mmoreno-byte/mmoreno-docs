# Drupal en prácticas

Experiencia con Drupal durante las prácticas profesionales en ANDWEBSOL SL, gestionando y optimizando contenidos del portal andalucia.com.

## TL;DR

Drupal es un CMS potente pero con curva de aprendizaje pronunciada. En andalucia.com aprendí a gestionar contenido a gran escala: tipos de contenido, taxonomías, vistas, y bloques. Lo más valioso fue entender cómo Drupal separa contenido de presentación.

## Qué es Drupal

Sistema de gestión de contenidos (CMS) open source escrito en PHP. Se diferencia de WordPress en que es más flexible y escalable, pero también más complejo.

**Usos típicos**:
- Portales institucionales (universidades, gobiernos)
- Sitios con mucho contenido estructurado
- Aplicaciones con requisitos complexos de permisos

## Lo que hice en andalucia.com

- Gestión y optimización de contenidos web
- Publicación, edición y organización de contenidos
- Trabajo con tipos de contenido y taxonomías
- Configuración de vistas y bloques
- Optimización de rendimiento

## Conceptos fundamentales

### Tipos de contenido

Cada "cosa" en Drupal es un tipo de contenido con sus propios campos.

Ejemplos de tipos en andalucia.com:

| Tipo | Campos |
|------|--------|
| **Noticia** | Título, body (rich text), fecha, imagen, categoría |
| **Evento** | Título, descripción, fecha inicio/fin, ubicación, documentos |
| **Página básica** | Título, body, imagen destacada |
| **Directorio** | Nombre, dirección, teléfono, categoría, coordenadas |

### Campos personalizados

```
Campo: field_category
Tipo: Entity Reference
Target: Taxonomy term
Widget: Select list
```

### Taxonomías

Sistema de clasificación mediante términos organizados en vocabularios.

```
Vocabulario: Categorías de noticias
├── Economía
├── Cultura
├── Deportes
└── Política
```

**Cómo Drupal maneja esto internamente**:
- Vocabularios → taxonomías → términos
- Cada término tiene un ID
- El contenido referencia términos por ID

### Vistas

El módulo Views permite crear listados sin código. En andalucia.com:

- **Lista de noticias por categoría**: todas las noticias de "Economía"
- **Eventos próximos**: filtrados por fecha > hoy
- **Buscador de directorio**: con filtros por categoría y ubicación

### Construir una vista (pasos)

1. **Crear vista**: Structure → Views → Add view
2. **Base table**: seleccionar tipo de contenido (ej: "Noticia")
3. **Fields**: añadir campos a mostrar (título, fecha, imagen)
4. **Filters**: añadir condiciones (publicado = sí, categoría = X)
5. **Sort criteria**: ordenar por fecha descendente
6. **Display**: página o bloque

## Gestión de contenidos

### Flujo de publicación

```
Borrador → Revisión → Publicado → Archivado
    │          │          │
    ▼          ▼          ▼
Solo autor   Editor    Visible     (con permisos)
```

Drupal permite workflow editorial configurable.

### Multilingüe

Andalucía.com tiene contenido en español e inglés. Drupal lo maneja con:

- **Entity translation**: cada entidad tiene su propia traducción
- **Configuration translation**: menús, bloques, vistas traducidas
- **Language switcher**: bloque para cambiar idioma

## Problemas comunes y soluciones

### Error: permisos de archivos subidos

Si usuarios no podían subir imágenes:

**Síntoma**: error "Permission denied" al intentar subir.

**Causa**: Drupal requiere permisos específicos en `sites/default/files`.

**Solución**:
```bash
chmod -R 775 sites/default/files
chown -R www-data:www-data sites/default/files
```

### Caché de vistas que no actualiza

Un contenido nuevo no aparecía en la lista.

**Síntoma**: vista muestra datos outdated.

**Solución**: invalidar caché manualmente
- Drupal Admin → Structure → Views → editar vista → Save (guardar fuerza rebuild)
- O desde CLI: `drush cr`

**Prevención**: en desarrollo, `drush cr all`.

### Contenido duplicado en búsquedas

**Causa**: index de search API desactualizado.

**Solución**: Re-indexar
```
drush search-api:reset
drush search-api:index
```

## Estructura de un portal Drupal

```
/
├── modules/           # Módulos custom
├── themes/           # Temas
├── profiles/         # Installation profiles
├── sites/
│   └── default/
│       ├── settings.php
│       └── files/    # Archivos subidos
└── drush/            # Alias de sites
```

## Módulos esenciales

| Módulo | Propósito |
|--------|-----------|
| **Pathauto** | URLs automáticas basadas en patrones |
| **Token** | Reemplazar tokens en textos |
| **Views** | Crear listados y páginas |
| **Webform** | Formularios de contacto |
| **Metatag** | SEO (meta tags) |
| **Entity API** | Programación con entidades |

## Lecciones aprendidas

### Drupal no es WordPress

La curva de aprendizaje es más pronunciada. Si en WordPress instalas un theme y funciona, en Drupal necesitas entender:

- Tipos de contenido y campos
- Taxonomías y vocabularios
- Permisos por rol
- Caché y performance

### El panel de administración es poderoso

Todo se hace desde la UI, incluyendo cosas que en otros CMS requieren código:

- Crear tipos de contenido con campos custom
- Configurar vistas complejas
- Gestionar taxonomías de miles de términos
- Workflows de revisión editorial

### Mantenimiento es clave

Un portal Drupal necesita mantenimiento regular:

- Actualizar core y módulos (security patches)
- Limpiar caché periódicamente
- Reindexar search si usas búsqueda
- Ver logs de errores

---

*Trabajar con Drupal en andalucia.com me dio perspectiva de cómo se gestiona contenido a gran escala. Entender Drupal ayuda a entender cualquier CMS—los conceptos se traducen.*
