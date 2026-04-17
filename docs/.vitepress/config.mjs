import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "mmoreno-dev docs",
  description: "Proyectos, apuntes y guías técnicas",
  themeConfig: {
    nav: [
      { text: 'Inicio', link: '/' },
      { text: 'Proyectos', link: '/proyectos/portfolio' },
      { text: 'Prácticas', link: '/practicas/cloudflare' },
      { text: 'Guías', link: '/guias/git-basico' }
    ],

    sidebar: [
      {
        text: 'Proyectos',
        items: [
          { text: 'Portfolio personal', link: '/proyectos/portfolio' },
          { text: 'CF Dashboard', link: '/proyectos/cf-dashboard' }
        ]
      },
      {
        text: 'Prácticas ANDWEBSOL',
        items: [
          { text: 'Cloudflare', link: '/practicas/cloudflare' },
          { text: 'Drupal', link: '/practicas/drupal' },
          { text: 'Python scripts', link: '/practicas/python' }
        ]
      },
      {
        text: 'Guías',
        items: [
          { text: 'Git básico', link: '/guias/git-basico' },
          { text: 'Entornos Python', link: '/guias/python-venv' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/mmoreno-byte' }
    ]
  }
})