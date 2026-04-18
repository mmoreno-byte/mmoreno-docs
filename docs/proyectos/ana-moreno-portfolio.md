# Portfolio Ana Moreno

Portfolio profesional para Ana Moreno, fotógrafa de conciertos y diseñadora gráfica. Proyecto de cliente donde aprendí a adaptar un diseño genérico a una personalidad de marca específica.

**Repositorio:** https://github.com/mmoreno-byte/ana-moreno-portfolio

## TL;DR

React + Vite + CSS puro para un portfolio de fotógrafa. Sin frameworks CSS, todo custom. El diferenciador: galería visual, servicios con precios, y diseño oscuro para destacar las fotos.

## Diferencia del portfolio personal

El portfolio personal (mmorenodev) es más técnico, con énfasis en proyectos y stack tecnológico.

Este portfolio es **visual-first**: las fotos son el contenido principal, no hay menciones de código o tecnologías.

## Arquitectura

```
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── Hero.jsx
│   │   ├── Gallery.jsx
│   │   ├── Services.jsx
│   │   ├── About.jsx
│   │   ├── Contact.jsx
│   │   └── Footer.jsx
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
├── public/
├── vite.config.js
└── package.json
```

## Diseño visual

### Paleta oscura

```css
:root {
  --bg-primary: #0a0a0a;
  --bg-secondary: #141414;
  --text-primary: #f5f5f5;
  --text-secondary: #a0a0a0;
  --accent: #d4a574;  /* Dorado, para detalles */
}
```

Colores oscuros para que las fotos destaquen. El dorado como color de acento evoca elegancia sin ser agresivo.

### Galería con grid responsive

```jsx
const Gallery = ({ images }) => {
  return (
    <div className="gallery-grid">
      {images.map((img, idx) => (
        <div key={idx} className="gallery-item">
          <img src={img} alt={`Photography work ${idx + 1}`} />
        </div>
      ))}
    </div>
  );
};
```

```css
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.gallery-item img {
  width: 100%;
  height: 300px;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.gallery-item:hover img {
  transform: scale(1.03);
}
```

## Servicios y precios

```jsx
const services = [
  {
    name: "Sesión de retratos",
    price: "150€",
    duration: "2 horas",
    includes: ["20 fotos editadas", "Galería online", "Entrega en 7 días"]
  },
  {
    name: "Cobertura de concerto",
    price: "A consultar",
    duration: "Según evento",
    includes: ["100+ fotos", "Edición artística", "Entrega en 14 días"]
  }
];
```

## Formulario de contacto con Formspree

Formspree permite añadir formularios funcionales sin backend:

```html
<form action="https://formspree.io/f/tu-form-id" method="POST">
  <input type="text" name="name" required />
  <input type="email" name="email" required />
  <textarea name="message"></textarea>
  <button type="submit">Enviar</button>
</form>
```

El formulario se configura en formspree.io, donde también puedes ver los mensajes recibidos.

## Despliegue en GitHub Pages

Igual que el portfolio personal:

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci && npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          build_dir: dist
```

## Lecciones aprendidas

1. **CSS puro es suficiente para proyectos pequeños**: no necesitas Tailwind o Bootstrap para todo. CSS custom properties + flexbox/grid resuelve la mayoría de casos.

2. **El diseño debe adaptarse al cliente**: no uses la misma paleta o layout para un portfolio de fotógrafa que para un portfolio de developer.

3. **Formspree simplifica formularios sin backend**: perfecta para sitios estáticos donde no necesitas un servidor.

---

*Ana Moreno Portfolio me enseñó que el código es solo una parte del desarrollo—el diseño y la comunicación con el cliente son igual de importantes.*
