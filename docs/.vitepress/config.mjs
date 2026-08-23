import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "mmoreno-dev docs",
  description: "Proyectos, apuntes y guías técnicas de Loli Moreno — Desarrolladora Web, Ciberseguridad y SAP ABAP Cloud",

  head: [
    ['link', { rel: 'icon', href: '/vite.svg' }],
    ['meta', { property: 'og:title', content: 'mmoreno-dev · Documentación técnica' }],
    ['meta', { property: 'og:description', content: 'Proyectos reales, decisiones técnicas y lecciones aprendidas. mmoreno.dev' }],
    ['meta', { property: 'og:url', content: 'https://mmoreno.dev' }],
    ['meta', { property: 'og:type', content: 'website' }]
  ],

  themeConfig: {
    nav: [
      { text: 'Portfolio', link: 'https://mmoreno.dev' },
      { text: 'Proyectos', link: '/proyectos/portfolio' },
      { text: 'Guías', link: '/guias/git-basico' },
      { text: 'SAP', link: '/sap/proyecto1-rap' }
    ],

    sidebar: [
      {
        text: 'Destacado',
        items: [
          { text: 'Portfolio personal', link: '/proyectos/portfolio' },
          { text: 'MM Web Studio', link: '/proyectos/web-studio' }
        ]
      },
      {
        text: 'IA',
        items: [
          { text: 'RAG Document Agent', link: '/proyectos/rag-document-agent' },
          { text: 'Claude Chat', link: '/proyectos/claude-chat' }
        ]
      },
      {
        text: 'Backend / APIs',
        items: [
          { text: 'Videogames API', link: '/proyectos/videogames-api' },
          { text: 'Job Board', link: '/proyectos/job-board' },
          { text: 'Sistema de Reservas', link: '/proyectos/sistema-reservas' },
          { text: 'Data Dashboard', link: '/proyectos/data-dashboard' }
        ]
      },
      {
        text: 'Frontend',
        items: [
          { text: 'Ana Moreno Portfolio', link: '/proyectos/ana-moreno-portfolio' },
          { text: 'Videogames Frontend', link: '/proyectos/videogames-frontend' }
        ]
      },
      {
        text: 'Datos / Analytics',
        items: [
          { text: 'CF Dashboard', link: '/proyectos/cf-dashboard' },
          { text: 'GitHub Analytics', link: '/proyectos/github-analytics' }
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
      },
      {
        text: 'SAP ABAP Cloud',
        items: [
          { text: 'Proyecto 1: CRUD con RAP', link: '/sap/proyecto1-rap' },
          { text: 'SAP-Turismo (colaboración)', link: '/sap/sap-turismo' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/mmoreno-byte' },
      { icon: 'link', link: 'https://mmoreno.dev' }
    ]
  }
})
