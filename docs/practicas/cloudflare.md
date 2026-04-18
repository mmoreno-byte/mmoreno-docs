# Cloudflare en prácticas

Apuntes y experiencia adquirida durante las prácticas profesionales en ANDWEBSOL SL trabajando con Cloudflare para el portal andalucia.com.

## TL;DR

Cloudflare actúa como intermediario entre usuarios y servidor: acelera contenido con CDN, protege con WAF, y permite lógica en el edge con Workers. Trabajar con él en producción me enseñó que no es solo "activar CDN"—hay que entender qué cachear y qué no.

## Qué es Cloudflare

Plataforma de seguridad y rendimiento web. Cuando un usuario visita tu sitio:

```
Sin Cloudflare:
Usuario → Tu servidor (latencia alta, expuesto, sin protección)

Con Cloudflare:
Usuario → Cloudflare Edge (cerca del usuario) → Tu servidor (protegido, acelerado)
```

## Lo que hice en andalucia.com

- Implementación y configuración de Cloudflare en proyectos reales
- Gestión de caché de contenido estático (imágenes, CSS, JS)
- Aplicación de reglas de seguridad WAF
- Optimización del tráfico web
- Configuración de Cloudflare Workers como proxies

## CDN (Content Delivery Network)

Red de servidores distribuidos geográficamente. El contenido se sirve desde el servidor edge más cercano al usuario.

**Sin CDN** (usuario en Sevilla, servidor en Frankfurt):
```
Latencia: ~100ms
```

**Con CDN** (servidor edge en Madrid):
```
Latencia: ~10ms
```

### Configuración de caché para imágenes

```bash
# Regla en panel de Cloudflare
# Cache-Control: public, max-age=31536000
# Para imágenes: .jpg, .png, .webp, .svg
```

### Invalidar caché

Cuando subes una nueva versión de un archivo, Cloudflare lo sigue sirviendo desde caché. Opciones:

1. **Purge individual**: desde el panel o API
2. **Purge todo**: `cf.bypassCache` en headers de respuesta
3. **Versioning**: `style.v2.css` en vez de `style.css`

## Caché de contenido estático

**Lo que se cachea automáticamente**:
- Imágenes (.jpg, .png, .webp, .svg)
- CSS y JS compilados
- Fuentes (.woff2)
- Videos (según configuración)

**Lo que NO se cachea** (o debe configurarse):
- HTML dinámico (páginas personalizadas)
- APIs (JSON responses)
- Contenido con cookies personalizas

### Error típico: cachear contenido dinámico

Si tu página muestra "Hola María" personalizada, no la cachees. Si lo haces, el siguiente usuario verá "Hola María" aunque no sea él.

**Diagnóstico**: buscar en respuesta el header `CF-Cache-Status: HIT`. Si aparece en contenido dinámico, hay un problema.

## WAF (Web Application Firewall)

Firewall que filtra tráfico malicioso antes de llegar al servidor.

```
Solicitud maliciosa → Cloudflare WAF → ¿Bloqueado? → Tu servidor
```

### Reglas que configuré

**Bloquear IPs sospechosas**:
```
IP Reputation > 20
```

**Proteger endpoint de login**:
```
(http.request.uri.path contains "/login") and (cf.threat_score > 14)
```

**Regla de-rate limiting**:
```
http.request.uri.path contains "/api" and http.request.table("auth_failures") > 5
```

### Tipos de ataques que bloquea

- **SQL Injection**: `' OR 1=1 --`
- **XSS**: `<script>alert(1)</script>`
- **Bot traffic**: patrones automatizados
- **DDoS**: volumen anormal de tráfico

## Workers: lógica en el edge

Cloudflare Workers son funciones serverless que se ejecutan en el edge (antes de llegar al servidor de origen).

### Ejemplo: proxy para API de Cloudflare Analytics

```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  if (request.url.includes('/api/analytics')) {
    // Añadir API key sin exponerla al cliente
    const apiKey = CLOUDFLARE_API_KEY;
    const headers = new Headers(request.headers);
    headers.set('Authorization', `Bearer ${apiKey}`);

    const response = await fetch(request.url, {
      method: request.method,
      headers,
      body: request.body
    });

    return new Response(response.body, {
      status: response.status,
      headers: response.headers
    });
  }

  return fetch(request);
}
```

### ¿Cuándo usar Workers?

- **Modificar peticiones/respuestas** sin tocar el servidor de origen
- **Añadir autenticación** en el edge antes de llegar a tu API
- **A/B testing** sin cambiar código del servidor
- **Redirects geográficos** según ubicación del usuario

## Comandos útiles de Wrangler

Wrangler es la CLI de Cloudflare:

```bash
# Instalar
npm install -g wrangler

# Login
wrangler login

# Crear Worker desde template
wrangler generate mi-worker

# Deploy
wrangler deploy

# Development local
wrangler dev

# Gestionar secrets
wrangler secret put API_KEY
wrangler secret delete API_KEY

# Ver logs
wrangler tail
```

## Lecciones aprendidas

### Error: cachear contenido personalizado

En andalucia.com había una sección con contenido por usuario. La caché de Cloudflare sirvió contenido de un usuario a otro.

**Solución**: revisar qué contenido tiene cookies o headers personalizas. En el panel de Cloudflare, ver `CF-Cache-Status: HIT` en respuestas que no deberían cachearse.

**Prevención**: usar `Cache-Control: private` para contenido que no debe cachearse.

### CORS: preflight requests

Las peticiones `OPTIONS` (preflight CORS) llegan a Cloudflare primero. Si bloqueas `OPTIONS` en WAF, tu API no funciona desde otros dominios.

**Configuración**: permitir `OPTIONS` en reglas de firewall o crear una regla específica para preflight.

### CDN no es gratis para todo tipo de contenido

Cloudflare tiene tiered caching, pero el plan gratuito tiene limitaciones. Para tráfico alto, el plan Pro es necesario.

## Arquitectura del proxy con Workers

```
Cliente ──▶ Cloudflare Edge ──▶ Worker (evalúa petición)
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    ▼                     ▼                     ▼
              Origen (origen 1)      Origen (origen 2)       Caché
```

El Worker puede rutear peticiones a diferentes orígenes según la URL, añadir headers, o responder desde caché.

---

*Trabajar con Cloudflare en producción me enseñó que CDN es más que "activar缓存". Entender qué cachear, cuándo invalidar, y cómo diagnosticar problemas de caché es una habilidad por sí sola.*
