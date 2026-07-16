# CF Dashboard

Dashboard para visualizar métricas de Cloudflare Analytics del dominio `mmoreno.dev`. Estado: **desplegado**.

**Tipo:** proyecto personal · **Stack:** React + Vite + Cloudflare Workers + Cloudflare Pages

## Estado

🟢 **Activo** — ya tengo dominio propio en Cloudflare (`mmoreno.dev`), así que la dependencia que lo tenía pausado está resuelta. Dashboard en producción, métricas reales.

## Idea original

Dashboard en React que consume la API de Cloudflare para mostrar:

- Tráfico por día/hora
- Amenazas bloqueadas
- Hit rate de caché
- Países de origen de visitantes
- Distribución por tipo de recurso

## Arquitectura

```
┌──────────────────┐    /api/metrics     ┌────────────────────────┐    GraphQL/REST
│   React App      │ ──────────────────▶ │  Cloudflare Worker     │ ────────────────▶ Cloudflare API
│   Dashboard      │ ◀─────────────────  │  (proxy seguro)        │ ◀────────────────
└──────────────────┘    JSON + caché     └────────────────────────┘
        ▲
        │
   Cloudflare Pages
   (hosting estático)
```

El Worker se encarga de:

1. Recibir la petición del frontend
2. Añadir el `Authorization: Bearer <API_TOKEN>`
3. Llamar a la API de Cloudflare Analytics
4. Cachear la respuesta (KV) para no superar rate limits
5. Devolver JSON saneado al frontend

## Stack

- **React 19 + Vite** — Frontend
- **Cloudflare Workers** — Proxy seguro para la API key
- **Cloudflare Pages** — Hosting del frontend estático
- **Cloudflare KV** — Caché de respuestas de métricas
- **Wrangler** — CLI de deploy

## Worker — código completo

```javascript
// src/worker.js
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': 'https://mmoreno.dev',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (url.pathname === '/api/metrics') {
    const zoneId = ZONE_ID;  // bound via wrangler.toml
    const range = url.searchParams.get('range') || '24h';

    // Cache key
    const cacheKey = `metrics:${zoneId}:${range}`;
    const cached = await METRICS_KV.get(cacheKey, 'json');
    if (cached) {
      return jsonResponse(cached, { 'X-Cache': 'HIT' });
    }

    // Calcular fechas según rango
    const since = computeSince(range);

    const query = `
      query {
        viewer {
          zones(filter: { zoneTag: "${zoneId}" }) {
            totals: httpRequests1hGroups(
              limit: 24,
              filter: { datetime_gt: "${since}" }
            ) {
              dimensions { datetime }
              sum { requests, threats, cached, bytes }
            }
            countries: httpRequests1hGroups(
              limit: 200,
              filter: { datetime_gt: "${since}" }
            ) {
              dimensions { countryName }
              sum { requests, threats }
            }
          }
        }
      }
    `;

    const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();

    // Cache por 5 minutos
    await METRICS_KV.put(cacheKey, JSON.stringify(data), {
      expirationTtl: 300,
    });

    return jsonResponse(data, { 'X-Cache': 'MISS' });
  }

  return new Response('Not found', { status: 404 });
}

function jsonResponse(data, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': 'https://mmoreno.dev',
      ...extraHeaders,
    },
  });
}

function computeSince(range) {
  const now = new Date();
  const hours = range === '24h' ? 24 : range === '7d' ? 168 : 720;
  now.setHours(now.getHours() - hours);
  return now.toISOString();
}
```

## `wrangler.toml`

```toml
name = "cf-dashboard-api"
main = "src/worker.js"
compatibility_date = "2024-01-01"

[vars]
ZONE_ID = "tu-zone-id-de-mmorenodev"

# Secrets (NO subir al repo, set con `wrangler secret put API_TOKEN`)
# API_TOKEN = "..."

[[kv_namespaces]]
binding = "METRICS_KV"
id = "tu-kv-namespace-id"
```

## Despliegue

### Frontend (Cloudflare Pages)

```bash
cd frontend
npm run build
npx wrangler pages deploy dist --project-name=cf-dashboard
```

Configurar dominio custom `cf.mmoreno.dev` (o subdominio preferido) en Pages.

### Worker

```bash
# Primera vez
npx wrangler kv:namespace create METRICS_KV
# Anota el id y pégalo en wrangler.toml

# Secret (no se sube al repo)
npx wrangler secret put API_TOKEN

# Deploy
npx wrangler deploy
```

URL del Worker: `https://cf-dashboard-api.tu-cuenta.workers.dev/api/metrics`

## Decisiones técnicas

### La API key nunca sale del Worker

Igual que con Groq API en Claude Chat: la API key de Cloudflare solo vive en el Worker como **secret** (cifrada en Cloudflare). El frontend llama al Worker, el Worker llama a Cloudflare.

Si pones la key en el frontend, cualquiera puede usarla y agotar tu cuota.

### Cache con KV para no superar rate limits

Cloudflare Analytics API tiene límites. Cachear 5 minutos por `(zone, range)` evita reventar el rate limit si recargas la página varias veces. El header `X-Cache: HIT/MISS` permite verificar que funciona.

### GraphQL sobre REST

Para series temporales con varios buckets, GraphQL con `httpRequests1hGroups` devuelve en una sola query lo que REST te obligaría a pedir en N peticiones. Trade-off: query más compleja de mantener, pero latencia mucho menor.

### Rango configurable

El parámetro `?range=24h|7d|30d` se traduce a `hours` y a la fecha de inicio de la query. Mantiene el código simple y el Worker stateless.

## Lecciones aprendidas

### El proxy es la pieza clave

Sin Worker, tendrías que montar un servidor Node/Express solo para ocultar la API key. Cloudflare Workers resuelve eso en 80 líneas de JS y un `wrangler deploy`.

### KV no es un cache "gratis" infinito

KV cobra por lectura y escritura. 5 minutos de TTL es el sweet spot entre frescura y coste. Para métricas que se ven en tiempo real, considera Durable Objects o WebSockets (más complejo).

### Cloudflare Pages + Workers es un stack completo

Pages para estático, Workers para lógica, KV para caché, R2 si necesitas almacenamiento, D1 si necesitas SQL. Todo bajo el mismo login y el mismo dashboard. Es difícil no recomendarlo para proyectos pequeños/medios.

## Próximos pasos

- [ ] Añadir autenticación (Cloudflare Access) para que el dashboard no sea público
- [ ] WebSockets para refresco en tiempo real
- [ ] Más métricas: cache hit ratio por path, top user agents
- [ ] Alertas vía Discord webhook cuando `threats` supere umbral
