# Inquiry Forum Specification

## Purpose

Define el foro de consultas contextualizadas, sus respuestas, búsqueda, estados y permisos de moderación.

## Requirements

### Requirement: Authenticated inquiry visibility
El sistema SHALL permitir que cualquier usuario autenticado liste y vea consultas y respuestas.

#### Scenario: Inquiry list
- **WHEN** un usuario abre `/inquiries`
- **THEN** el sistema SHALL mostrar las consultas más recientes primero con autor y contexto expandido

### Requirement: Inquiry search
El sistema SHALL permitir buscar consultas por título, descripción, autor, clase, trabajo práctico, sprint y contenido de respuestas.

#### Scenario: Debounced search
- **WHEN** el usuario deja de escribir durante 500 milisegundos
- **THEN** el sistema SHALL actualizar el parámetro `search` de la URL y ejecutar la búsqueda de servidor

#### Scenario: Matching response
- **WHEN** el texto aparece en una respuesta
- **THEN** el sistema SHALL incluir la consulta asociada entre los resultados, dentro de los límites de búsqueda configurados

### Requirement: Client-side inquiry filters
El sistema SHALL permitir filtrar el conjunto cargado por todas, pendientes, resueltas o propias.

#### Scenario: My inquiries filter
- **WHEN** un usuario autenticado selecciona “Mis Consultas”
- **THEN** el sistema SHALL mostrar solo consultas cuyo autor sea ese usuario

### Requirement: Inquiry creation
El sistema SHALL permitir a cualquier usuario autenticado crear una consulta con título, descripción y contexto opcional de clase o trabajo práctico.

#### Scenario: Contextual creation
- **WHEN** la creación se inicia desde una clase o trabajo práctico
- **THEN** el formulario SHALL preseleccionar ese contexto y la consulta SHALL aparecer en su detalle

#### Scenario: Initial status
- **WHEN** se crea una consulta
- **THEN** el sistema SHALL asignar el estado `Pendiente` y el autor actual

### Requirement: Inquiry lifecycle
El sistema SHALL permitir al autor, docente o administrador marcar una consulta como `Resuelta`, reabrirla como `Pendiente` o eliminarla.

#### Scenario: Resolve inquiry
- **WHEN** una persona autorizada marca una consulta pendiente como resuelta
- **THEN** el sistema SHALL persistir `status = "Resuelta"` y actualizar listados y detalle

#### Scenario: Unauthorized lifecycle mutation
- **WHEN** un usuario que no es autor, docente ni administrador intenta modificarla
- **THEN** PocketBase SHALL rechazar la operación

### Requirement: Inquiry responses
El sistema SHALL permitir a cualquier usuario autenticado responder con contenido no vacío y SHALL mostrar las respuestas en orden de creación.

#### Scenario: Add response
- **WHEN** un usuario envía contenido no vacío
- **THEN** el sistema SHALL crear la respuesta con su autor y refrescar el detalle

### Requirement: Response moderation
El sistema SHALL permitir eliminar una respuesta a su autor, a un docente o a un administrador.

#### Scenario: Authorized deletion
- **WHEN** una persona autorizada confirma la eliminación
- **THEN** el sistema SHALL borrar la respuesta y actualizar el detalle

### Requirement: Teacher response distinction
El sistema SHALL distinguir visualmente las respuestas realizadas por docentes o administradores.

#### Scenario: Teacher response rendered
- **WHEN** el autor expandido tiene rol `docente` o `admin`
- **THEN** la respuesta SHALL mostrar identificación visual de docente
