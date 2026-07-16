# Portfolio personal

Mi sitio web personal, ahora con dominio propio. El primer proyecto donde desplegué algo en producción con CI/CD automático y donde más he iterado el diseño.

**URL en vivo:** [https://mmoreno.dev](https://mmoreno.dev)
**Repositorio:** https://github.com/mmoreno-byte/mmoreno-byte.github.io (rama `mmorenodev`)

## TL;DR

Portfolio unipersonal con secciones de hero, about, experiencia, habilidades, proyectos y contacto. Stack: **React 19 + Vite 7** desplegado en **GitHub Pages** bajo el dominio `mmoreno.dev` (gestionado en Cloudflare). Bio, datos de contacto y proyectos se mantienen sincronizados con esta documentación.

## El cambio a mmoreno.dev

Antes: `https://mmoreno-byte.github.io/mmorenodev/` (subdirectorio en GitHub Pages).

Ahora: `https://mmoreno.dev` — dominio propio en Cloudflare, con CNAME apuntando al Pages de GitHub. Cambio motivado por:

- URL limpia y compartible (sin subdirectorio)
- Marca personal más reconocible
- Base para añadir más subdominios (`docs.mmoreno.dev`, `studio.mmoreno.dev`, etc.) bajo el mismo paraguas de Cloudflare

El `base` en `vite.config.js` pasó de `/mmorenodev/` a `/`, lo que simplifica el build y los assets.

## Stack

- **React 19** — Librería principal de UI
- **Vite 7** — Bundler y servidor de desarrollo
- **CSS3** — Estilos personalizados, animaciones, modo oscuro
- **@emailjs/browser** — Formulario de contacto funcional sin backend
- **react-icons** — Set de iconos
- **GitHub Actions** — CI/CD automático a GitHub Pages
- **Cloudflare DNS** — Gestión del dominio `mmoreno.dev`

## Arquitectura

```
portfolio/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── Hero.jsx              # Hero con typewriter + matrix background
│   │   ├── About.jsx             # Sobre mí
│   │   ├── Experience.jsx        # Timeline experiencia + formación
│   │   ├── Skills.jsx            # Barras de habilidades animadas
│   │   ├── Projects.jsx          # Grid de proyectos con filtros
│   │   ├── Contact.jsx           # Formulario EmailJS
│   │   ├── Navbar.jsx            # Navegación sticky
│   │   ├── Footer.jsx            # Links a redes
│   │   ├── Divider.jsx           # Separador visual
│   │   └── MatrixBackground.jsx  # Fondo animado estilo Matrix
│   ├── hooks/
│   │   ├── useInView.js          # Detectar scroll para animaciones
│   │   └── useTypewriter.js      # Efecto typewriter
│   ├── assets/
│   │   ├── perfil.jpg
│   │   └── perfil.png
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── .github/
│   └── workflows/
│       └── deploy.yml            # CI/CD → GitHub Pages
├── index.html                    # SEO + Open Graph
├── vite.config.js
└── package.json
```

## Secciones

### Hero

Typewriter con el nombre `mmorenodev` + fondo animado estilo Matrix. Badge "Disponible para trabajar". Iconos de stack técnico. Botón de descarga de CV. Enlaces a GitHub y LinkedIn.

```jsx
// hooks/useTypewriter.js
export default function useTypewriter(text, speed = 80, delay = 600) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    let i = 0;
    const id = setTimeout(() => {
      const interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) clearInterval(interval);
      }, speed);
    }, delay);
    return () => clearTimeout(id);
  }, [text, speed, delay]);
  return displayed;
}
```

### About

Bio narrativa: de educación a código, de APIs a LLMs. Lenguaje directo, primera persona.

### Experiencia y formación

Timeline con entradas de tipo `experiencia` / `formación` / `proyecto`, badges de color, tags por entrada. Datos:

- ANDWEBSOL SL — prácticas desarrollo web (Feb–May 2026): Drupal, Python, APIs
- Ayuntamiento de Granada — Analista de Ciberseguridad (Dic 2024 – Jun 2025)
- Ayuntamiento de Granada — Creadora de páginas web (Jun–Dic 2024): ZEO Granada
- COTEME — Docencia marketing digital (Sept 2025)
- FP DAW — Técnico Superior (Sept 2024 – Mayo 2026)

### Skills

Barras animadas con porcentaje, threshold de IntersectionObserver. Once visibles, se rellenan hasta su nivel.

### Projects

Grid con filtros por tecnología (`Todos`, `React`, `Java`, `Python`, `FastAPI`, `Flask`, `IA`, `Docker`). Tarjetas con:

- Descripción
- Tags
- Botones a web y repo
- **Tarjeta destacada de MM Web Studio** con estilo diferente y badge `Estudio`

### Contact

Formulario con `@emailjs/browser` para enviar directamente al correo sin levantar backend. Variables de entorno en `.env.local`:

```bash
VITE_EMAILJS_SERVICE_ID=...
VITE_EMAILJS_TEMPLATE_ID=...
VITE_EMAILJS_PUBLIC_KEY=...
```

Estados del formulario: `idle` → `sending` → `success` / `error` con feedback visual.

## SEO y Open Graph

```html
<title>Loli Moreno · Desarrolladora Full Stack & IA | mmoreno.dev</title>
<meta name="description" content="Portfolio de Loli Moreno, Desarrolladora Full Stack con experiencia en IA, ciberseguridad y diseño web. Proyectos con React, Python, Java y APIs." />
<meta property="og:title" content="Loli Moreno · Desarrolladora Full Stack & IA" />
<meta property="og:url" content="https://mmoreno.dev/" />
<meta property="og:image" content="https://mmoreno.dev/preview.svg" />
```

Cada vez que se comparte en redes, aparece tarjeta con preview.

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

Cloudflare gestiona el DNS: CNAME de `mmoreno.dev` → `mmoreno-byte.github.io`. El repo de GitHub Pages es el build artifact.

## Lecciones aprendidas

### Cambio de subdirectorio a dominio limpio

Pasar de `/mmorenodev/` a `/` parece trivial, pero toca:

- `base` en `vite.config.js`
- Rutas absolutas en `<link>` y `<meta>` del `index.html`
- URLs de assets en CSS (background-image, fuentes)
- URLs canónicas y Open Graph

La regla que aplico ahora: **desarrollo desde el primer día como si fueras a deployar en raíz**, y los subdirectorios como GitHub Pages ya no te pillan.

### EmailJS evita un backend completo

Para un portfolio personal, montar un servidor solo para reenviar un formulario de contacto es overkill. `@emailjs/browser` se ejecuta 100% en cliente y envía el email usando su servicio gratuito. Trade-off: tu Public Key queda expuesta, pero está limitada por dominio y sirve solo como remitente.

### Cloudflare DNS es el estándar para dominios de developer

Aunque GitHub Pages sirve el contenido, tener el DNS en Cloudflare te da:

- Proxy gratuito con caché
- Analytics por zona (base del proyecto CF Dashboard)
- Workers para lógica serverless sin servidor
- Gestión de subdominios centralizada

---

*El portfolio sigue siendo mi primer proyecto "serio" y el que más ha evolucionado. El salto a `mmoreno.dev` fue el primer paso para tratar la presencia online como un proyecto de software más, no como un sitio estático.*
