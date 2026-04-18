import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "mmoreno-dev docs",
  description: "Proyectos, apuntes y guías técnicas de un desarrollador en construcción",

  head: [
    ['link', { rel: 'icon', href: '/vite.svg' }]
  ],

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
          { text: 'Ana Moreno Portfolio', link: '/proyectos/ana-moreno-portfolio' },
          { text: 'CF Dashboard', link: '/proyectos/cf-dashboard' },
          { text: 'Videogames API', link: '/proyectos/videogames-api' },
          { text: 'Videogames Frontend', link: '/proyectos/videogames-frontend' },
          { text: 'Data Dashboard', link: '/proyectos/data-dashboard' },
          { text: 'GitHub Analytics', link: '/proyectos/github-analytics' },
          { text: 'Job Board', link: '/proyectos/job-board' },
          { text: 'Claude Chat', link: '/proyectos/claude-chat' }
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
          { text: 'Git avanzado', link: '/guias/git-avanzado' },
          { text: 'Entornos Python', link: '/guias/python-venv' },
          { text: 'Conceptos API REST', link: '/guias/api-rest-concepts' },
          { text: 'Docker fundamentos', link: '/guias/docker-fundamentos' },
          { text: 'Despliegue Google Cloud', link: '/guias/despliegue-google-cloud' },
          { text: 'Estructura React', link: '/guias/react-estructura' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/mmoreno-byte' }
    ]
  }
})
