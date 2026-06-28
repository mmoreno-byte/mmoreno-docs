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
      { text: 'Guías', link: '/guias/git-basico' },
      { text: 'SAP', link: '/sap/proyecto1-rap' }
    ],

    sidebar: [
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
          { text: 'Data Dashboard', link: '/proyectos/data-dashboard' }
        ]
      },
      {
        text: 'Frontend',
        items: [
          { text: 'Portfolio personal', link: '/proyectos/portfolio' },
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
          { text: 'Proyecto 1: CRUD con RAP', link: '/sap/proyecto1-rap' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/mmoreno-byte' }
    ]
  }
})