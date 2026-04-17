# Cloudflare en prácticas

Apuntes y experiencia adquirida durante las prácticas profesionales en
ANDWEBSOL SL trabajando con Cloudflare para el portal andalucia.com.

## Qué es Cloudflare

Plataforma de seguridad y rendimiento web que actúa como intermediario
entre los usuarios y el servidor, protegiendo y acelerando el tráfico.

## Lo que hice

- Implementación y configuración de Cloudflare en proyectos reales
- Gestión de caché de contenido estático, especialmente imágenes, mediante CDN
- Aplicación de reglas de seguridad WAF
- Optimización del tráfico web
- Configuración de Cloudflare Workers como proxies

## Conceptos clave aprendidos

### CDN (Content Delivery Network)
Red de servidores distribuidos que sirve el contenido desde el punto
geográfico más cercano al usuario, reduciendo la latencia.

### Caché
Almacenamiento temporal de contenido estático (imágenes, CSS, JS) para
no tener que pedirlo al servidor en cada visita.

### WAF (Web Application Firewall)
Firewall que filtra el tráfico malicioso antes de que llegue al servidor.
Bloquea ataques como SQL injection, XSS, bots, etc.

### Workers
Funciones serverless que se ejecutan en el edge de Cloudflare.
Permiten modificar peticiones y respuestas sin tocar el servidor.

## Comandos útiles

```bash
# Instalar Wrangler (CLI de Cloudflare)
npm install -g wrangler

# Iniciar sesión
wrangler login

# Desplegar un Worker
wrangler deploy
```