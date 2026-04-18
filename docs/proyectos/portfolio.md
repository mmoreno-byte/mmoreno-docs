# Portfolio personal

Mi sitio web personal. El primer proyecto donde desplegué algo en producción con CI/CD automático. Desarrollado con React 19 y Vite, desplegado en GitHub Pages.

**URL en vivo:** https://mmoreno-byte.github.io/mmorenodev/

## TL;DR

Portfolio unipersonal con secciones de hero, proyectos, habilidades, y contacto. Primer proyecto donde configuré GitHub Actions para deployment automático. El enfoque era mostrar proyectos reales (no tutoriales) con un diseño que llamara la atención.

## Tecnologías

- **React 19** — Librería principal de UI
- **Vite 7** — Bundler y servidor de desarrollo
- **CSS3** — Estilos personalizados con animaciones
- **GitHub Actions** — CI/CD automático
- **React Router DOM** — Navegación entre secciones

## Arquitectura

```
├── src/
│   ├── components/
│   │   ├── Hero.jsx           # Presentación + tecnologías
│   │   ├── Projects.jsx       # Grid de proyectos
│   │   ├── Skills.jsx         # Barras de habilidades
│   │   ├── Experience.jsx     # Experiencia laboral
│   │   ├── About.jsx          # Sobre mí
│   │   ├── Contact.jsx        # Información de contacto
│   │   ├── Navbar.jsx         # Navegación sticky
│   │   ├── Footer.jsx         # Links a redes
│   │   └── Divider.jsx        # Separador visual
│   ├── hooks/
│   │   └── useInView.js       # Detectar scroll para animaciones
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
└── public/
```

## Secciones

### Hero

Effect typewriter con las tecnologías que uso. Fondo animado estilo Matrix para dar un toque personal.

```jsx
const Hero = () => {
  const [text, setText] = useState('');

  useEffect(() => {
    const technologies = ['React', 'JavaScript', 'Python', 'Java'];
    // typewriter effect...
  }, []);

  return (
    <section className="hero">
      <div className="matrix-bg" />
      <h1>mmoreno-dev</h1>
      <p className="typewriter">{text}</p>
    </section>
  );
};
```

### Proyectos

Grid responsive con filtros por tecnología:

```jsx
const filteredProjects = filter === 'all'
  ? projects
  : projects.filter(p => p.tech.includes(filter));

return (
  <div className="projects-grid">
    {filteredProjects.map(project => (
      <ProjectCard key={project.id} project={project} />
    ))}
  </div>
);
```

### Skills

Barras de habilidades animadas con CSS:

```css
.skills-bar {
  width: 0;
  animation: fill 1s ease-out forwards;
}

@keyframes fill {
  to { width: var(--percentage); }
}
```

## CI/CD con GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - run: npm ci
      - run: npm run build

      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          build_dir: dist
```

Cada vez que hago push a `main`, GitHub Actions:
1. Instala dependencias
2. Construye el proyecto (`npm run build`)
3. Despliega a GitHub Pages automáticamente

## Diseño responsive

```css
/* Mobile first */
.projects-grid {
  display: grid;
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .projects-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .projects-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

## Open Graph y SEO

```html
<!-- index.html -->
<meta property="og:title" content="mmoreno-dev portfolio" />
<meta property="og:description" content="Desarrollador web en construcción" />
<meta property="og:image" content="/og-image.png" />
```

Permite que cuando compartes el link en redes sociales, aparezca una previsualización decente.

## Lecciones aprendidas

### GitHub Pages no sirve desde subdirectorios por defecto

Para que funcione correctamente desde un repositorio con nombre diferente al esperado:

```js
// vite.config.js
export default defineConfig({
  base: '/mmorenodev/',
  // ...
});
```

Sin esto, los assets se cargan desde `/` en vez de `/mmorenodev/` y todo rompe.

### Animaciones con CSS son suficientes

No necesitas librerías de animación para todo. `@keyframes` y `transition` cubren el 90% de los casos.

### CI/CD cambia todo

Antes de GitHub Actions, desplegar era un proceso manual: build → conectar por FTP → subir archivos. Ahora es push y listo. Esta fue la primera vez que experimenté las ventajas de DevOps en la práctica.

---

*El portfolio fue mi primer proyecto "serio" y el que me enseñó que hacer deploy no es tan difícil como parece. GitHub Pages + Actions es un stack gratuito sorprendentemente poderoso.*
