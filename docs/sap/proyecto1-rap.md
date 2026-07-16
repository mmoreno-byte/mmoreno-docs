# Proyecto 1: CRUD completo con RAP

Guía completa con código y explicaciones del primer proyecto SAP desarrollado en un sistema S/4HANA real durante las prácticas.

---

## 1. Arquitectura RAP — Las 5 capas

RAP (ABAP RESTful Application Programming Model) funciona en capas. Cada capa es un objeto ABAP independiente. La clave es entender qué hace cada una y por qué existe.

::: info ¿Qué es RAP?
RAP es el framework moderno de SAP para construir APIs REST y apps Fiori desde el backend ABAP. Defines los datos y la lógica de negocio en ABAP, y el sistema genera automáticamente el servicio OData y la interfaz Fiori. Sin JavaScript, sin frontend manual.
:::

| Capa | Objeto ABAP | Para qué sirve |
|------|-------------|----------------|
| 1. Base de datos | Database Table | Almacena los datos físicamente en S/4HANA |
| 2. Interface View | CDS Root View Entity | Define el modelo de datos — qué campos existen |
| 3. Projection View | CDS Projection View | Define qué ve el usuario y cómo (anotaciones @UI) |
| 4. Behavior Definition | BDEF | Define qué operaciones existen: crear, editar, borrar |
| 5. Service | Service Definition + Binding | Expone todo como endpoint OData accesible desde Fiori |

---

## 2. Tabla de base de datos — ZDEMO_TRAVELS

La tabla es la base de todo. Sin ella no hay datos. En ABAP Cloud se define con DDL (Data Definition Language), no con SE11 como en ABAP clásico.

### 2.1 Código completo

```abap
@EndUserText.label : 'Travel bookings'
@AbapCatalog.enhancement.category : #NOT_EXTENSIBLE
@AbapCatalog.tableCategory : #TRANSPARENT
@AbapCatalog.deliveryClass : #A
@AbapCatalog.dataMaintenance : #RESTRICTED
define table zdemo_travels {
  key client            : mandt not null;
  key travel_id         : sysuuid_x16 not null;
      description       : abap.char(100);
      status            : abap.char(1);         " O=Abierto A=Aceptado X=Cancelado
      begin_date        : abap.dats;
      end_date          : abap.dats;
      @Semantics.amount.currencyCode : 'zdemo_travels.currency_code'
      total_price       : abap.curr(16,2);
      @Semantics.amount.currencyCode : 'zdemo_travels.currency_code'
      booking_fee       : abap.curr(16,2);
      currency_code     : waers;
      created_by        : syuname;
      created_at        : timestampl;
      last_changed_by   : syuname;
      last_changed_at   : timestampl;
      local_last_changed_at : timestampl;
}
```

### 2.2 Explicación de cada anotación

| Anotación / Campo | Qué significa | Por qué importa |
|---|---|---|
| `@AbapCatalog.tableCategory : #TRANSPARENT` | Tabla física real en base de datos | La tabla existe con ese nombre exacto en BD. En ABAP clásico había otros tipos (pool, cluster) pero en Cloud todo es transparent |
| `@AbapCatalog.deliveryClass : #A` | Tabla de aplicación con datos de cliente | Clase A = datos del negocio. Clase C = customizing. Clase S = solo SAP. Para tablas propias siempre #A |
| `key client : mandt` | Mandante SAP — clave primaria 1 | SAP es multi-empresa. Cada empresa tiene un mandante. Campo obligatorio en toda tabla cliente |
| `key travel_id : sysuuid_x16` | UUID de 16 bytes — clave primaria 2 | En ABAP Cloud se usa UUID en vez de número secuencial. RAP lo genera automáticamente |
| `@Semantics.amount.currencyCode` | Vincula importe con su campo de moneda | Obligatorio en campos CURR. Sin esto RAP no sabe qué moneda usar y da error en el servicio |
| `last_changed_at : timestampl` | Timestamp de última modificación | Es el ETag de RAP. Detecta ediciones concurrentes — si dos usuarios editan a la vez, el segundo recibe un aviso |

::: warning Error frecuente
Si olvidas `@Semantics.amount.currencyCode` en los campos monetarios, el Service Binding dará error al publicar. Siempre antes del campo CURR, no después.
:::

---

## 3. CDS Interface View — ZI_TRAVELS

La Interface View lee la tabla y expone los campos con nombres en CamelCase. Es la capa base — no tiene anotaciones de UI. Solo define el modelo de datos.

### 3.1 Código completo

```abap
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Interface View for Travels'
define root view entity ZI_TRAVELS
  as select from zdemo_travels
{
  key travel_id             as TravelId,
      description           as Description,
      status                as Status,
      begin_date            as BeginDate,
      end_date              as EndDate,
      total_price           as TotalPrice,
      booking_fee           as BookingFee,
      currency_code         as CurrencyCode,
      created_by            as CreatedBy,
      created_at            as CreatedAt,
      last_changed_by       as LastChangedBy,
      last_changed_at       as LastChangedAt,
      local_last_changed_at as LocalLastChangedAt
}
```

### 3.2 Explicación línea a línea

| Elemento | Qué significa |
|---|---|
| `@AccessControl.authorizationCheck: #NOT_REQUIRED` | Desactiva el control de acceso. En producción usarías `#CHECK` con un DCL. Para desarrollo es suficiente `#NOT_REQUIRED` |
| `define root view entity` | `root` = entidad raíz del Business Object en RAP. Sin root no puedes crear un Behavior Definition managed |
| `as select from zdemo_travels` | Lee los datos de la tabla. Como un SELECT en SQL pero declarativo |
| `travel_id as TravelId` | Renombra el campo de snake_case a CamelCase. El nombre CamelCase es el que verás en el BDEF y en Fiori |

::: tip Interface View vs Projection View
**Interface View (ZI_)** = modelo de datos técnico. Sin anotaciones UI. Es la base.

**Projection View (ZC_)** = lo que ve el usuario. Con anotaciones `@UI` que controlan el layout de Fiori.

Siempre hay dos capas CDS en RAP.
:::

---

## 4. CDS Projection View — ZC_TRAVELS

La Projection View es lo que ve el usuario final. Aquí van las anotaciones `@UI` que controlan qué campos aparecen en la lista, en el formulario de detalle y como filtros. Fiori Elements las lee y genera la UI automáticamente.

### 4.1 Código completo

```abap
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Projection View for Travels'
@Metadata.allowExtensions: true
@UI.headerInfo: {
  typeName: 'Travel',
  typeNamePlural: 'Travels',
  title: { type: #STANDARD, value: 'Description' }
}
define root view entity ZC_TRAVELS
  provider contract transactional_query
  as projection on ZI_TRAVELS
{
  @UI.facet: [{ id: 'Travel', purpose: #STANDARD,
                type: #IDENTIFICATION_REFERENCE,
                label: 'Travel Details', position: 10 }]
  key TravelId,

  @UI.lineItem:       [{ position: 10, label: 'Description' }]
  @UI.identification: [{ position: 10, label: 'Description' }]
  Description,

  @UI.lineItem:       [{ position: 20, label: 'Status' }]
  @UI.identification: [{ position: 20, label: 'Status' }]
  @UI.selectionField: [{ position: 10 }]
  Status,

  @UI.lineItem:       [{ position: 30, label: 'Begin Date' }]
  @UI.identification: [{ position: 30, label: 'Begin Date' }]
  BeginDate,

  @UI.lineItem:       [{ position: 40, label: 'End Date' }]
  @UI.identification: [{ position: 40, label: 'End Date' }]
  EndDate,

  @UI.lineItem:       [{ position: 50, label: 'Total Price' }]
  @UI.identification: [{ position: 50, label: 'Total Price' }]
  @Semantics.amount.currencyCode: 'CurrencyCode'
  TotalPrice,

  @UI.identification: [{ position: 60, label: 'Booking Fee' }]
  @Semantics.amount.currencyCode: 'CurrencyCode'
  BookingFee,

  @UI.identification: [{ position: 70, label: 'Currency' }]
  CurrencyCode,

  CreatedBy, CreatedAt,
  LastChangedBy, LastChangedAt, LocalLastChangedAt
}
```

### 4.2 Anotaciones @UI — para qué sirve cada una

| Anotación | Dónde aparece en Fiori | Parámetros clave |
|---|---|---|
| `@UI.lineItem` | Columna en la lista de registros | `position`: orden de la columna. `label`: texto de la cabecera |
| `@UI.identification` | Campo en el formulario de detalle/edición | `position`: orden en el formulario. `label`: etiqueta del campo |
| `@UI.selectionField` | Filtro en la barra de búsqueda | `position`: orden del filtro |
| `@UI.headerInfo` | Cabecera de la página de detalle | `typeName`, `typeNamePlural`, `title` |
| `@UI.facet` | Sección del formulario de detalle | `type: #IDENTIFICATION_REFERENCE` agrupa los campos de `@UI.identification` |

::: tip Regla de posición
El valor de `position` determina el orden de los campos. Usa múltiplos de 10 (10, 20, 30...) para poder insertar campos entre medias en el futuro sin reorganizar todo.
:::

---

## 5. Behavior Definition — ZI_TRAVELS y ZC_TRAVELS

El Behavior Definition (BDEF) define qué operaciones existen en el Business Object: crear, editar, borrar. Hay dos BDEFs: uno para la Interface View (implementación) y otro para la Projection View (exposición al exterior).

### 5.1 BDEF de la Interface View — implementación

```abap
managed implementation in class zbp_i_travels unique;
strict ( 2 );

define behavior for ZI_TRAVELS alias Travel
  persistent table zdemo_travels
  lock master
  authorization master ( global )
  etag master LastChangedAt
{
  field ( numbering : managed, readonly ) TravelId;
  field ( readonly ) CreatedBy, CreatedAt, LastChangedBy,
                     LastChangedAt, LocalLastChangedAt;

  create;
  update;
  delete;

  mapping for zdemo_travels
  {
    TravelId           = travel_id;
    Description        = description;
    Status             = status;
    BeginDate          = begin_date;
    EndDate            = end_date;
    TotalPrice         = total_price;
    BookingFee         = booking_fee;
    CurrencyCode       = currency_code;
    CreatedBy          = created_by;
    CreatedAt          = created_at;
    LastChangedBy      = last_changed_by;
    LastChangedAt      = last_changed_at;
    LocalLastChangedAt = local_last_changed_at;
  }
}
```

### 5.2 BDEF de la Projection View — exposición

```abap
projection;
strict ( 2 );

define behavior for ZC_TRAVELS alias Travel
  use etag
{
  use create;
  use update;
  use delete;
}
```

### 5.3 Conceptos clave del BDEF

| Concepto | Qué significa | Por qué importa |
|---|---|---|
| `managed` | RAP gestiona el INSERT/UPDATE/DELETE en BD automáticamente | No necesitas escribir código de persistencia. RAP lo hace solo |
| ETag (`LastChangedAt`) | Mecanismo de bloqueo optimista | Si dos usuarios editan el mismo registro, el segundo recibe un error de conflicto |
| `numbering: managed` | RAP genera el UUID del TravelId automáticamente al crear | No necesitas generar el UUID manualmente |
| `authorization master (global)` | Control de autorizaciones a nivel global | El método `get_global_authorizations` en la clase de implementación decide los permisos |
| `mapping` | Traduce CamelCase (CDS) a snake_case (tabla) | La tabla usa snake_case, la CDS usa CamelCase. El mapping le dice a RAP cómo traducir |
| `use etag / use create` | El BDEF de projection hereda del BDEF de interface | Solo expones lo que el BDEF de interface ya tiene definido |

---

## 6. Clase de implementación — ZBP_I_TRAVELS

La clase de implementación es donde va el código ABAP real. En modo managed sin validaciones, está casi vacía — RAP gestiona todo automáticamente. Se rellena en el Proyecto 2 cuando se añaden validaciones y lógica de negocio.

### 6.1 Código completo

```abap
" --- Global Class ---
CLASS zbp_i_travels DEFINITION
  PUBLIC ABSTRACT FINAL
  FOR BEHAVIOR OF zi_travels.
ENDCLASS.

CLASS zbp_i_travels IMPLEMENTATION.
ENDCLASS.

" --- Local Types (pestaña aparte en ADT) ---
CLASS lhc_travel DEFINITION
  INHERITING FROM cl_abap_behavior_handler.
  PRIVATE SECTION.
    METHODS get_global_authorizations
      FOR GLOBAL AUTHORIZATION
        IMPORTING REQUEST requested_authorizations FOR Travel
        RESULT result.
ENDCLASS.

CLASS lhc_travel IMPLEMENTATION.
  METHOD get_global_authorizations.
    result = VALUE #(
      %create = if_abap_behv=>auth-allowed
      %update = if_abap_behv=>auth-allowed
      %delete = if_abap_behv=>auth-allowed
    ).
  ENDMETHOD.
ENDCLASS.
```

### 6.2 Dónde va cada parte en ADT

| Pestaña en ADT | Qué va ahí |
|---|---|
| **Global Class** | La definición e implementación vacía de `zbp_i_travels`. No se toca. |
| **Local Types** | La clase `lhc_travel` con el método de autorización. Aquí irán las validaciones en el Proyecto 2. |

::: info ¿Por qué está vacía?
En RAP managed, el framework gestiona automáticamente el create, update y delete en base de datos. La clase de implementación solo necesita el método de autorización. En el Proyecto 2 se añadirán métodos para validar fechas, calcular precios y cambiar estados.
:::

---

## 7. Service Definition y Service Binding

El servicio es la última capa. Expone el Business Object como un endpoint OData accesible desde Fiori o desde cualquier cliente REST.

### 7.1 Service Definition — ZSD_TRAVELS

```abap
@EndUserText.label: 'Service Definition for Travels'
define service ZSD_TRAVELS {
  expose ZC_TRAVELS as Travel;
}
```

### 7.2 Service Binding — ZSB_TRAVELS_V2

| Parámetro | Valor | Por qué |
|---|---|---|
| Name | `ZSB_TRAVELS_V2` | Nombre del binding. V2 indica que es OData V2 |
| Binding Type | OData V2 - UI | Para RAP managed SIN draft se usa V2. OData V4 requiere draft capability |
| Service Definition | `ZSD_TRAVELS` | El Service Definition que expone |

::: warning OData V2 vs OData V4 en RAP
OData V4 es el estándar moderno y el recomendado por SAP. Sin embargo, para RAP en modo managed **SIN draft**, el Service Binding V4 genera un servicio READ-ONLY. Para tener Create/Edit/Delete desde Fiori con managed sin draft, hay que usar **OData V2**.

En el Proyecto 2, cuando se añada draft capability, se podrá migrar a V4.
:::

### 7.3 Pasos para publicar el servicio

1. Crear la Service Definition con el código anterior
2. Crear el Service Binding (OData V2 - UI, apuntando a la Service Definition)
3. Activar con `Ctrl+F3`
4. Pulsar el botón **Publish** en el editor del Service Binding
5. Hacer clic en **Preview** para abrir la app Fiori en el navegador

---

## 8. Insertar datos de prueba — ZDEMO_INSERT_DATA

Como el sistema de training tiene restricciones de autorización para escritura desde Fiori con OData V4, se puede usar una clase ABAP con la interfaz `if_oo_adt_classrun` para insertar datos directamente.

::: info Nota importante
Con OData V2 ya puedes crear datos directamente desde la app Fiori. Esta clase solo fue necesaria durante el desarrollo cuando se usaba V4. Se documenta aquí porque es útil para cargas masivas de datos de prueba.
:::

### 8.1 Código completo

```abap
CLASS zdemo_insert_data DEFINITION
  PUBLIC FINAL CREATE PUBLIC.
  PUBLIC SECTION.
    INTERFACES if_oo_adt_classrun.
ENDCLASS.

CLASS zdemo_insert_data IMPLEMENTATION.
  METHOD if_oo_adt_classrun~main.
    DATA lv_uuid TYPE sysuuid_x16.
    lv_uuid = cl_system_uuid=>create_uuid_x16_static( ).

    INSERT zdemo_travels FROM @( VALUE #(
      client                = sy-mandt
      travel_id             = lv_uuid
      description           = 'Viaje a Roma'
      status                = 'O'
      begin_date            = '20250601'
      end_date              = '20250610'
      total_price           = 1500
      booking_fee           = 50
      currency_code         = 'EUR'
      created_by            = sy-uname
      created_at            = cl_abap_context_info=>get_system_date( )
      last_changed_by       = sy-uname
      last_changed_at       = cl_abap_context_info=>get_system_date( )
      local_last_changed_at = cl_abap_context_info=>get_system_date( )
    ) ).

    IF sy-subrc = 0.
      out->write( 'Registro insertado OK' ).
      COMMIT WORK.
    ELSE.
      out->write( 'Error al insertar' ).
    ENDIF.
  ENDMETHOD.
ENDCLASS.
```

### 8.2 Cómo ejecutarla

1. Clic derecho sobre la clase en el Project Explorer
2. **Run As → ABAP Application (Console)**
3. Verás el mensaje `Registro insertado OK` en la consola
4. Para insertar más registros: cambia los valores y vuelve a ejecutar

---

## 9. Subir el código a GitHub con abapGit

abapGit permite sincronizar objetos ABAP de un sistema SAP con un repositorio Git. Así puedes versionar tu código y compartirlo como cualquier otro proyecto de software.

### 9.1 Pasos para enlazar el repositorio

1. Crear repositorio en GitHub (con README.md para que exista la rama main)
2. En Eclipse: **Window → Show View → Other → ABAP → abapGit Repositories**
3. Clic en el botón `+` para añadir repositorio
4. Pegar la URL: `https://github.com/usuario/repositorio.git` ← con `.git` al final
5. Branch: `main` · Package: `ZDEMO_RAP`

### 9.2 Pasos para hacer push (subir código)

1. Clic derecho sobre `ZDEMO_RAP` en abapGit Repositories → **Stage and Push**
2. Seleccionar todos los objetos con el botón `+`
3. Escribir el Commit Message (ej: `feat: Project 1 - RAP CRUD complete`)
4. Pulsar **Commit and Push**
5. Introducir credenciales: Username = usuario GitHub · Password = Personal Access Token

::: tip Personal Access Token de GitHub
GitHub no acepta la contraseña normal para operaciones Git. Hay que crear un token en:

`github.com → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token`

Marcar el scope `repo`. Guardar el token — **solo se muestra una vez**.
:::

### 9.3 Si el repositorio está vacío (sin rama main)

Si el repositorio de GitHub está vacío, abapGit no puede seleccionar la rama main. Solución: crear el README desde la terminal antes de enlazar.

```bash
git clone https://github.com/usuario/repositorio.git
cd repositorio
echo "# Mi proyecto" > README.md
git add README.md
git commit -m "Initial commit"
git push origin main
```

---

## 10. Lecciones aprendidas y errores frecuentes

### 10.1 Errores que encontramos y cómo resolverlos

| Error | Causa | Solución |
|---|---|---|
| `'managed' is unexpected word` | Estabas editando la CDS View en vez del Behavior Definition | Busca el BDEF en la carpeta **Behavior Definitions** del Project Explorer — icono con B azul |
| Service Binding READ-ONLY | OData V4 sin draft capability es solo lectura | Usar OData V2 - UI para RAP managed sin draft |
| `Annotation with reference to currency code is missing` | Falta `@Semantics.amount.currencyCode` antes del campo CURR | Añadir la anotación antes de cada campo `abap.curr` |
| `'Travel' not defined in ZI_TRAVELS` | Usando el nombre de entidad en vez del alias en la clase | Usar el alias definido en el BDEF: `alias Travel` → `FOR Travel` |
| `abapGit: branch field frozen` | El repositorio GitHub no tiene la rama main creada | Crear README.md en GitHub primero para que exista la rama main |
| `Invalid credentials en abapGit` | Usando contraseña de GitHub en vez de Personal Access Token | Crear un Token (classic) con scope `repo` y usarlo como contraseña |
| `define root view entity needed` | El Behavior Definition requiere una root entity | Cambiar `define view entity` a `define root view entity` en la CDS |

### 10.2 Conceptos que hay que tener claros

- Siempre hay **DOS Behavior Definitions**: uno para `ZI_` (implementación) y otro para `ZC_` (exposición)
- Siempre hay **DOS CDS Views**: Interface View (`ZI_`) y Projection View (`ZC_`)
- Las anotaciones `@UI` van en la Projection View, **nunca** en la Interface View
- El campo `client` (mandante) nunca aparece en la Projection View ni en Fiori — RAP lo gestiona internamente
- Los campos de administración (`created_by`, `created_at`...) son readonly en el BDEF — RAP los rellena solo
- **OData V2** para managed sin draft · **OData V4** para managed con draft (Proyecto 2)
- El alias del BDEF (`alias Travel`) es el nombre que usas en la clase de implementación

### 10.3 Próximos pasos — Proyecto 2

En el Proyecto 2 se añadirá lógica de negocio real al Business Object:

- **Validaciones**: `begin_date` debe ser anterior a `end_date`
- **Determinaciones**: calcular `total_price` automáticamente al cambiar `booking_fee`
- **Acciones**: botón "Aprobar" que cambia el status de `O` a `A`
- **Feature Control**: deshabilitar edición cuando el status es `X` (Cancelado)
- **Draft capability**: activar OData V4 con draft para edición en borrador
