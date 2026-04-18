# CF Dashboard

Proyecto en pausa. Dashboard para visualizar métricas de Cloudflare Analytics.

## Estado

⏳ **Pausado** — requiere un dominio propio en Cloudflare para acceder a las métricas de Analytics por zona.

## Idea original

Dashboard en React que consume la API de Cloudflare para mostrar:
- Tráfico por día/hora
- Amenazas bloqueadas
- Hit rate de caché
- Países de origen de visitantes

## Arquitectura prevista

```
┌─────────────────┐         ┌──────────────────────┐
│   React App     │ ──────▶ │   Cloudflare API    │
│   Dashboard     │         │   (requiere dominio) │
└─────────────────┘         └──────────────────────┘
        │
        ▼
  Cloudflare Worker (proxy para API key)
```

## Stack previsto

- **React + Vite** — Frontend
- **Cloudflare Workers** — Proxy seguro para la API
- **Cloudflare Pages** — Hosting

## Por qué está pausado

Cloudflare Analytics API requiere un dominio propio verificado en Cloudflare. Sin dominio propio, solo puedes acceder a métricas limitadas.

El proyecto era un ejercicio de integración con API externa + visualización de datos. Cuando tenga un dominio propio, será el primero en desplegar.

## Lecciones intermedias

### Cloudflare Workers como proxy

```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);

  if (url.pathname === '/api/metrics') {
    const zoneId = CLOUDFLARE_ZONE_ID;
    const apiToken = CLOUDFLARE_API_TOKEN;

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/analytics/dashboard`,
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response;
  }

  return fetch(request);
}
```

### La API key de Cloudflare no debe estar en el frontend

Igual que con Groq API en Claude Chat, la API key de Cloudflare solo debe estar en el backend (en este caso, Workers). El frontend llama al Worker, el Worker hace la llamada a Cloudflare.

## Cuándo retomarlo

Cuando tenga un dominio propio. El código está diseñado para estar listo:

1. Configurar dominio en Cloudflare
2. Desplegar Worker
3. Conectar Worker a Cloudflare Pages
4. Desplegar frontend

---

*CF Dashboard me enseñó a planificar proyectos con dependencias externas. No todo está en mi control—a veces hay que pausar y esperar a que las piezas estén en su sitio.*
