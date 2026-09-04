# Videogames API

API REST para gestionar una colección de videojuegos, construida con Java 21 y Spring Boot. Es mi primer proyecto con tipado fuerte y autenticación JWT real.

**URL en producción:** https://videogames-api-wjej.onrender.com
**Swagger UI:** https://videogames-api-wjej.onrender.com/api-docs

## TL;DR

Backend Java/Spring Boot desplegado en Render (Docker vía `render.yaml`) con base de datos PostgreSQL en Neon, autenticación JWT, y documentación OpenAPI (Swagger). El escollo más grande fue configurar CORS para que el frontend pudiera hacer peticiones. *(Migrado de Railway a Render en agosto 2026; base de datos migrada de Render a Neon en septiembre 2026 porque el Postgres free de Render caduca a los 30 días.)*

## Arquitectura

```
┌─────────────┐     HTTP/JWT      ┌──────────────────────────┐     JDBC     ┌────────────┐
│  Frontend   │ ────────────────▶ │   Render (Docker)         │ ──────────▶ │ PostgreSQL │
│  (React)    │ ◀──────────────── │   Java 21 + Spring Boot   │             │   (Neon)   │
└─────────────┘                   └──────────────────────────┘             └────────────┘
                                        │
                                        ▼
                               Swagger UI (/api-docs)
```

## Decisiones técnicas

### ¿Por qué Java 21 + Spring Boot?

Mi primera API "seria" fue en Python con Flask. Funcionaba bien, pero quería aprender un lenguaje con **tipado fuerte** que me obligara a pensar más en la estructura de datos desde el principio.

Java 21 trae features interesantes:
- **Records**: clases inmutables perfectas para DTOs
- **Pattern matching**: switch expressions más limpios
- **Virtual threads**: concurrencia más ligera (aunque no lo aproveché al máximo)

Spring Boot reduce enormemente el código repetitivo. No necesitas configurar cada dependencia manualmente; Spring Boot autoconfigura casi todo basándose en lo que detecta en el classpath.

### ¿Por qué JWT sobre sesiones?

Las sesiones necesitan almacenar estado en el servidor. En un entorno con múltiples instancias (como Railway), cada petición podría ir a una instancia diferente que no tiene la sesión del usuario.

JWT es **stateless**: toda la información del usuario viaja en el token mismo. El servidor solo necesita verificar la firma, sin consultar ninguna sesión almacenada. Esto escala horizontalmente sin problemas.

### ¿Por qué H2 para desarrollo y PostgreSQL para producción?

```yaml
# application.yml
spring:
  datasource:
    url: jdbc:h2:mem:testdb    # Desarrollo: base en memoria
  jpa:
    hibernate:
      ddl-auto: create-drop    # Recrear esquema en cada inicio

---
spring:
  config:
    activate:
      on-profile: prod
  datasource:
    url: ${SPRING_DATASOURCE_URL}  # Producción: cadena JDBC completa (Neon)
  jpa:
    hibernate:
      ddl-auto: validate      # Producción: no tocar el esquema
```

**H2 en desarrollo**: rápido, no necesita instalación, se crea automáticamente.
**PostgreSQL en producción**: más robusto, persiste los datos. Antes se montaba a partir de host/puerto/db sueltos que daba Render; ahora es una única URL JDBC completa, porque la base ya no la gestiona Render sino Neon.

El mismo código, perfiles diferentes.

## Modelo de datos

```java
@Entity
@Table(name = "games")
public class Game {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String genre;
    private String platform;
    private Integer releaseYear;
    private Double rating;
}
```

```java
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;  // BCrypt hash, nunca texto plano
}
```

## Endpoints principales

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/register` | Registrar usuario | No |
| POST | `/api/auth/login` | Login, devuelve JWT | No |
| GET | `/api/games` | Listar todos | Sí |
| POST | `/api/games` | Crear juego | Sí |
| GET | `/api/games/{id}` | Obtener uno | Sí |
| PUT | `/api/games/{id}` | Actualizar | Sí |
| DELETE | `/api/games/{id}` | Eliminar | Sí |
| GET | `/api/games/search?title=` | Buscar por título | Sí |
| GET | `/api/games/genre/{genre}` | Filtrar por género | Sí |

### Ejemplo: Login

```bash
curl -X POST https://videogames-api-wjej.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "demo", "password": "demo1234"}'
```

Respuesta:
```json
{
  "token": "eyJhbGciOiJIUzM4NCJ9...",
  "type": "Bearer"
}
```

### Ejemplo: Listar juegos

```bash
curl https://videogames-api-wjej.onrender.com/api/games \
  -H "Authorization: Bearer eyJhbGciOiJIUzM4NCJ9..."
```

## El problema CORS

Después de terminar el backend, el frontend no podía hacer peticiones. El navegador bloqueaba todo con un error que al principio no entendía:

```
Access to fetch at 'https://videogames-api-wjej.onrender.com' from origin
'https://mmoreno-byte.github.io' has been blocked by CORS policy
```

Resultó que **Spring Security, por defecto, bloquea todo excepto el endpoint de login**. El problema era que el frontend y el backend están en dominios diferentes.

**Solución inicial** (en el controlador):
```java
@CrossOrigin(origins = "*")
@RestController
public class GameController {
    // ...
}
```

**Solución correcta** (configuración global en `SecurityConfig`):
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .anyRequest().authenticated()
            );
        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(
            "https://mmoreno.dev",
            "https://mmoreno-byte.github.io",
            "http://localhost:5173"
        ));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
```

> **Lección aprendida**: `@CrossOrigin` funciona por controlador, pero una configuración centralizada es más mantenible y te permite control granular por ruta.

## Lecciones aprendidas

1. **Spring Security es complejo al principio**: la documentación es extensa pero dispersa. Entender el flujo de filtrado (filter chain) tomó tiempo.

2. **BCrypt es el estándar para passwords**: nunca guards passwords en texto plano. Spring Security con BCrypt lo hace fácil:
   ```java
   @Bean
   public PasswordEncoder passwordEncoder() {
       return new BCryptPasswordEncoder();
   }
   ```

3. **Los DTOs son importantes**: no devuelvas entidades JPA directamente. Crea DTOs para controlar qué campos expone tu API.

4. **Desplegar un JAR de Java en un free tier es más sencillo con Docker que sin él**: empecé en Railway con el JAR directo y luego migré a Render con este mismo `Dockerfile`.

5. **Cuidado con las bases de datos "free" en un PaaS**: el Postgres gratuito de Render no solo se duerme por inactividad como el web service — caduca a los 30 días y se borra si no subes de plan. Al principio usaba `fromDatabase` en `render.yaml` para que Render aprovisionara y conectara la base sola, pero eso ata la base al ciclo de vida (y a la caducidad) del proveedor del web service. Migré a Neon (Postgres serverless con plan free que solo suspende el cómputo por inactividad, sin borrar los datos) con una única variable `SPRING_DATASOURCE_URL` en vez de depender de esa integración automática.

## Dockerfile

```dockerfile
FROM eclipse-temurin:21-jdk-alpine
WORKDIR /app
COPY target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

## Despliegue: Render + Neon

```yaml
# render.yaml
services:
  - type: web
    name: videogames-api
    env: docker
    plan: free
    dockerfilePath: ./Dockerfile
    healthCheckPath: /api-docs
    envVars:
      - key: SPRING_DATASOURCE_URL
        sync: false
      - key: SPRING_DATASOURCE_USERNAME
        sync: false
      - key: SPRING_DATASOURCE_PASSWORD
        sync: false
      - key: JWT_SECRET
        generateValue: true
```

Ya no hay bloque `databases:` — la base de datos no vive en Render, vive en un proyecto de Neon aparte. Las tres variables con `sync: false` no se guardan en el repo: se rellenan a mano en el dashboard de Render con los datos de conexión que da Neon (host del pooler, usuario y contraseña), con esta forma para `SPRING_DATASOURCE_URL`:

```
jdbc:postgresql://<host-pooler>.neon.tech/<database>?sslmode=require&channel_binding=require
```

Un GitHub Action con `cron: "*/12 * * * *"` hace ping a `/api-docs` (con reintentos, para no fallar por un arranque en frío puntual) para que el free tier de Render no se duerma tras 15 min de inactividad.

## Usuario demo

| Campo | Valor |
|-------|-------|
| Username | `demo` |
| Password | `demo1234` |

---

*Videogames API fue el proyecto donde más aprendí sobre seguridad web, estructura de APIs REST, y el ecosistema Java/Spring.*

> Más documentación en [mmoreno.dev](https://mmoreno.dev) → Proyectos.
