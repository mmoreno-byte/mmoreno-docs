# INE Padrón Pipeline

Pipeline de ingeniería de datos: extrae la población por provincia del INE, la carga en PostgreSQL y la transforma en tres capas analíticas con dbt (staging → intermediate → marts), todo orquestado con Docker Compose.

**Repositorio:** https://github.com/mmoreno-byte/pipeline
**Docs dbt (linaje + tests):** https://pipeline-docs-7rt.pages.dev

## TL;DR

ETL en Docker Compose: un extractor Python descarga la API del INE, PostgreSQL guarda el raw, y dbt lo transforma en tres capas con tests automáticos. La documentación que genera `dbt docs generate` (linaje de datos, columnas, tests) se despliega sola en Cloudflare Pages cada vez que hay un push, vía GitHub Actions. El proyecto venía de un ZIP que tuve que revisar bug a bug: la extracción parecía funcionar (no crasheaba) pero cargaba datos corruptos en silencio.

## Arquitectura

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌────────────────────┐
│  API INE    │────▶│  PostgreSQL  │────▶│     dbt      │────▶│  Marts + docs       │
│  (JSON)     │     │  raw schema  │     │  3 capas SQL │     │  (Cloudflare Pages) │
└─────────────┘     └──────────────┘     └──────────────┘     └────────────────────┘
   extract.py         raw.padron_       staging/intermediate/    dbt docs generate
   (Python)           municipal              marts                  + GH Actions
```

| Capa | Schema | Materialización | Propósito |
|---|---|---|---|
| Raw | `raw` | Tabla | Volcado directo de la API |
| Staging | `staging` | View | Limpieza, tipos, filtros |
| Intermediate | `intermediate` | Table | Ratio de feminización + variación interanual (YoY) |
| Marts | `marts` | Table | Rankings nacionales, clasificación por tamaño, listas para BI |

## El bug real: el código asumía una forma de API que no era la real

El extractor no crasheaba — eso fue lo peligroso. Cargaba **1590 filas sin ningún error**, pero todas con `provincia = "00 / Desconocida"` y `hombres`/`mujeres` en `NULL`. La causa: el código pedía campos que la API del INE no devuelve por defecto.

```python
# Antes — asume campos que no existen en la respuesta real
codigo_mun = serie.get("Codigo", "")          # la API devuelve "COD", no "Codigo"
metadatos = serie.get("MetaData", [])         # solo aparece si pides tip=AM
sexo = next((m["Nombre"] for m in metadatos
             if m["Variable"]["Nombre"] == "Sexo"), "Total")  # y la clave es "T3_Variable"
```

```python
# Después — pide metadatos explícitamente y usa las claves reales
url = f"{INE_BASE_URL}/DATOS_TABLA/{tabla_id}?nult={nult}&tip=AM"
...
provincia_meta = next(
    (m for m in metadatos if m.get("T3_Variable") == "Provincias"), None
)
sexo = next(
    (m.get("Nombre", "") for m in metadatos if m.get("T3_Variable") == "Sexo"),
    "Total",
)
```

El test de dbt `assert_suma_sexos_consistente` (hombres + mujeres ≈ total) falló en el 100% de las filas — la señal de que algo estaba mal antes incluso de mirar los datos a mano.

## Descubrimiento de alcance: la tabla no era "por municipio"

El README original prometía ">8.000 municipios". Los números no cuadraban: la API devolvía exactamente **159 series** — que resultan ser 52 provincias × 3 sexos + 3 filas de "Total Nacional". La tabla 2852 del INE tiene granularidad **provincial**, no municipal.

Decisión (consultada antes de tocar nada): renombrar `municipio_*` → `provincia_*` en todo el proyecto en vez de buscar otra tabla del INE. El mart `mart_municipios_destacados` (top/bottom municipios por provincia) dejó de tener sentido al no existir esa granularidad, así que lo rehice como `mart_provincias_destacadas` (top/bottom 10 provincias a nivel nacional).

## docker-compose: el entrypoint de la imagen se comía el comando

```yaml
# Antes — la imagen ghcr.io/dbt-labs/dbt-postgres ya tiene ENTRYPOINT ["dbt"],
# así que esto se ejecutaba como `dbt sh -c "..."` → Error: No such command 'sh'
command: >
  sh -c "dbt deps && dbt run && dbt test && dbt docs generate"
```

```yaml
# Después — se sobrescribe el entrypoint explícitamente
entrypoint: ["/bin/sh", "-c"]
command:
  - "dbt deps && dbt run && dbt test && dbt docs generate"
```

## CI/CD: GitHub Actions genera los docs y los publica en Cloudflare Pages

```yaml
# .github/workflows/dbt-docs.yml
- name: Run pipeline (extract -> dbt run -> dbt test -> dbt docs generate)
  run: |
    docker compose up -d --build
    code=$(docker wait ine_dbt)
    docker logs ine_dbt
    docker compose down
    exit "$code"

- name: Deploy docs to Cloudflare Pages
  uses: cloudflare/pages-action@v1
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    projectName: pipeline-docs
    directory: dbt_project/target
    branch: master
```

`docker wait` bloquea hasta que el contenedor de dbt termina y devuelve su código de salida — así el job de CI falla de verdad si `dbt test` falla, en vez de reportar éxito porque el `docker compose up` en sí no crasheó.

## Incidente de seguridad: un secret con el token como nombre

Al configurar `CLOUDFLARE_API_TOKEN` como secret del repo, el primer intento salió mal: apareció un secret llamado literalmente `CFUT_XSU2HFTHI2...` (el valor del token, usado como *nombre*). En GitHub, el **valor** de un secret va cifrado, pero el **nombre no** — cualquiera con acceso de admin al repo puede leerlo con `gh secret list`. Ese token se dio por comprometido: se revocó en Cloudflare, se generó uno nuevo y se guardó correctamente con `gh secret set CLOUDFLARE_API_TOKEN` (dejando que el propio comando pidiera el valor, sin pasarlo como argumento).

## Lecciones aprendidas

1. **"No crashea" no es lo mismo que "funciona"**: el extractor cargaba miles de filas sin ningún error, pero eran basura. Los tests de dbt (`assert_suma_sexos_consistente`) fueron los que realmente detectaron el problema — sin ellos, esos datos habrían llegado tal cual a un dashboard.

2. **Verificar los supuestos del código contra la API real**, no contra la documentación o el propio código: `curl` a mano contra el endpoint real reveló en dos minutos que las claves (`COD` vs `Codigo`) y la estructura (`tip=AM` para metadatos) no coincidían con lo que el extractor asumía.

3. **Los nombres de los secrets de GitHub no van cifrados**: si el valor de un token acaba como nombre de un secret por error, ese token está expuesto y hay que revocarlo — no basta con borrar el secret mal creado.

---

*Este proyecto me enseñó a no fiarme de un pipeline solo porque no lanza excepciones, y a verificar los datos de verdad (con tests, no solo con logs en verde) antes de darlo por bueno.*

> Más documentación en [mmoreno.dev](https://mmoreno.dev) → Proyectos.
