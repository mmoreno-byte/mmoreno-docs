# SAP-Turismo (Loli + Jose)

Sistema de gestión de reservas turísticas como proyecto de portfolio conjunto, demostrando el patrón **clean core** de SAP: backend en ABAP Cloud/RAP y una capa de extensión de negocio en SAP CAP.

**Tipo:** colaboración · **Estado:** demo pública ejecutable
**Repositorio:** https://github.com/mmoreno-byte/SAP-Turismo

## Autoría

- **Jose** — Backend ABAP Cloud / RAP (Eclipse ADT)
- **Loli** — Extensión de negocio SAP CAP (VS Code) · Testing · Documentación

## Objetivo

Demostrar con un caso de negocio real — gestión de reservas de excursiones turísticas — el patrón **clean core** que SAP recomienda para S/4HANA Cloud / BTP.

La idea: separar responsabilidades en dos capas.

- **Backend ABAP Cloud / RAP** — capa de negocio principal
- **CAP** — capa de extensión, lógica adicional y demo ejecutable
- **Fiori Elements** — vista de List Report generada automáticamente sobre cada servicio

El proyecto no es solo un ejercicio técnico, sino una pieza de portfolio que demuestra modelado de datos, servicios OData, lógica de negocio, validaciones, pruebas, documentación y toma de decisiones técnicas.

## Arquitectura

| Capa | Responsable | Tecnología | Qué hace |
|---|---|---|---|
| Backend | Jose | ABAP Cloud + RAP | Expone entidades mediante Business Objects RAP y un servicio OData V4 |
| Extensión | Loli | SAP CAP | Validaciones, cálculo de precios, gestión de cupo, cancelación mock y estadísticas |
| Frontend | Ambos | SAP Fiori Elements | Vista de List Report generada automáticamente |
| Testing | Loli / Jose | Jest + pruebas funcionales RAP | Tests automatizados en CAP y validación funcional en Fiori Preview |

## Capas del proyecto

### `turismo-sap/` — Capa CAP (Loli, ejecutable)

Código Node.js que cualquiera puede clonar y correr con `cds watch`. Funciona con datos mock locales, sin sistema SAP externo ni credenciales. Permite probar:

- Creación de reservas con validaciones
- Cancelación de reservas
- Cálculo de precios
- Actualización de cupos
- Endpoint de estadísticas
- Tests automatizados con Jest + `cds.test`

### `abap-backend/` — Capa ABAP Cloud / RAP (Jose, lectura/evaluación)

Código fuente real del backend ABAP Cloud / RAP, pensado para lectura y evaluación técnica. No es ejecutable directamente: requiere un sistema SAP BTP con ABAP Cloud habilitado.

Las capturas en `capturas/` documentan el funcionamiento real de esta capa en Fiori Elements Preview y en el `$metadata` del servicio OData.

## Entidades del sistema

| Entidad | Origen ABAP | Descripción |
|---|---|---|
| `Excursiones` | `ZI_EXCURSION_JAG` | Catálogo de excursiones con destino, duración, precio y capacidad |
| `Disponibilidades` | `ZI_DISPON_JAG` | Fechas y cupos por excursión |
| `Clientes` | `ZI_CLIENTE_JAG` | Datos básicos de clientes |
| `Reservas` | `ZC_RESERVA_JAG` | Reserva con estado, número de personas y precio final |
| `ReservasDetalle` | `ZI_RESERVA_DET_JAG` | Vista combinada reserva + cliente + excursión + disponibilidad |

Relación de negocio:

```text
Excursión → Disponibilidad → Reserva → Cliente
```

Una excursión puede tener varias disponibilidades. Una disponibilidad puede tener varias reservas. Una reserva pertenece a un cliente y a una disponibilidad concreta.

## Servicio OData

```text
Service Definition: ZUI_TURISMO_JAG
Service Binding:    ZUI_TURISMO_BIND_JAG
Tipo:               OData V4 - UI
```

URL del metadata (usado por CAP para importar el modelo):

```text
https://bc728399-6646-47e6-9524-3850b586a9a4.abap-web.eu10.hana.ondemand.com/sap/opu/odata4/sap/zui_turismo_bind_jag/srvd/sap/zui_turismo_jag/0001/$metadata?sap-client=100
```

## Lógica de cancelación (acción RAP)

Como ampliación del backend ABAP Cloud / RAP, Jose implementó una acción de negocio `cancelarReserva` que:

1. Cambia el estado de la reserva a `Cancelada`
2. Libera el cupo ocupado en la disponibilidad asociada

Lógica detallada en [`documentacion/cancelacion-reserva-rap.md`](https://github.com/mmoreno-byte/SAP-Turismo/blob/main/documentacion/cancelacion-reserva-rap.md).

### Additional Save — el error `BEHAVIOR_ILLEGAL_STATEMENT`

El primer intento de actualizar el cupo dentro de la acción falló con `BEHAVIOR_ILLEGAL_STATEMENT`. La causa: intentar hacer `UPDATE` directo sobre la tabla de disponibilidades dentro de la acción.

Solución: añadir `with additional save` en el Behavior Definition y mover la actualización del cupo a la clase `saver` (`lsc_zi_reserva_jag`).

## Lógica en CAP (Loli)

La capa CAP implementa la misma operativa con datos mock para que la demo sea reproducible sin acceso al sistema SAP:

### Creación de reserva

1. Valida que `NumPersonas` > 0
2. Comprueba que la disponibilidad exista
3. Calcula el cupo libre
4. Rechaza si no hay cupo suficiente
5. Busca la excursión asociada
6. Calcula el precio final
7. Fija estado inicial `Pendiente`
8. Actualiza el cupo ocupado

### Cálculo de precio

```text
PrecioBase × FactorTemporada × NumPersonas
```

### Cancelación de reserva en CAP

Acción `cancelarReserva` coherente con la RAP:

- Busca la reserva
- Comprueba estado `Pendiente`
- Cambia a `Cancelada`
- Libera cupo en la disponibilidad
- Devuelve error controlado si se intenta cancelar dos veces

### Endpoint de estadísticas

Función custom `getEstadisticas()` que calcula:

- Total de reservas
- Reservas pendientes / confirmadas / canceladas
- Ingresos totales
- Porcentaje medio de ocupación

## Tests automatizados (Loli)

7 tests con Jest + `cds.test` en la capa CAP:

1. Creación de reserva válida con precio calculado correctamente
2. Rechazo si `NumPersonas` es 0
3. Rechazo si no hay cupo suficiente
4. Aplicación del descuento de grupo
5. Cancelación de reserva pendiente con liberación de cupo
6. Bloqueo de doble cancelación
7. Respuesta correcta del endpoint de estadísticas

```bash
cd turismo-sap
npm test
```

## Decisiones técnicas

### Datos mock en CAP

Se decidió usar datos mock en CAP para que la demo pública sea **reproducible** y no dependa del acceso temporal al sistema de training SAP. Esto evita exponer credenciales y que el portfolio deje de funcionar cuando expire el acceso.

### Dos implementaciones de cancelación

La cancelación existe en dos capas:

- **RAP real** — lógica de ciclo de vida en el backend ABAP (Jose)
- **CAP mock** — demo pública ejecutable sin credenciales (Loli)

No es redundancia, es una decisión deliberada para demostrar el patrón clean core y mantener una demo pública reproducible.

### ABAP Unit — limitación del entorno

Se evaluó añadir ABAP Unit para `cancelarReserva` usando CDS Test Double Framework. En el entorno ABAP Cloud disponible no se encontró la clase `CL_CDS_TEST_ENVIRONMENT`, por lo que no se implementaron para evitar código incompatible.

La validación de `cancelarReserva` se apoya en pruebas funcionales reales en Fiori Elements Preview. Los ABAP Unit tests quedan como mejora futura.

## Estado del proyecto

| Bloque | Estado |
|---|---|
| CAP — creación de reserva | ✅ Completo y probado |
| CAP — cancelación de reserva | ✅ Completo y probado |
| RAP — cancelación de reserva | ✅ Completo y probado en Fiori Preview |
| CAP — endpoint de estadísticas | ✅ Completo y probado |
| CAP — tests automatizados | ✅ 7 tests, todos en verde |
| RAP — ABAP Unit | ⚠️ Evaluado, no implementado por limitación del entorno |
| RAP — pruebas funcionales | ✅ Cancelación, liberación de cupo y doble cancelación validadas |

## Demo local

```bash
git clone https://github.com/mmoreno-byte/SAP-Turismo
cd SAP-Turismo/turismo-sap
npm install
cds watch
```

Servicio disponible en `http://localhost:4004`.

## Documentación adicional

- [`documentacion/arquitectura-general.md`](https://github.com/mmoreno-byte/SAP-Turismo/blob/main/documentacion/arquitectura-general.md)
- [`documentacion/entidades-odata.md`](https://github.com/mmoreno-byte/SAP-Turismo/blob/main/documentacion/entidades-odata.md)
- [`documentacion/cancelacion-reserva-rap.md`](https://github.com/mmoreno-byte/SAP-Turismo/blob/main/documentacion/cancelacion-reserva-rap.md)
- [`documentacion/resumen-tecnico.md`](https://github.com/mmoreno-byte/SAP-Turismo/blob/main/documentacion/resumen-tecnico.md)

## Contacto de los autores

- Jose — ABAP Cloud / RAP: [LinkedIn](https://www.linkedin.com/in/jose-antonio-gonz%C3%A1lez-de-la-torre)
- Loli — CAP / Fiori / Testing: [LinkedIn](https://www.linkedin.com/in/mar%C3%ADa-dolores-moreno-cabrera-194983151/)

---

*SAP-Turismo demuestra una arquitectura SAP moderna: ABAP Cloud, RAP, CDS Views, OData V4, CAP, Fiori Elements, tests automatizados y documentación completa. Pieza de portfolio para mostrar conocimientos prácticos en desarrollo SAP moderno, clean core y separación de responsabilidades por capas.*
