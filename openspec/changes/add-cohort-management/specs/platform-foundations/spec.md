## MODIFIED Requirements

### Requirement: Active educational data model
El sistema SHALL persistir las capacidades web mediante `users`, `courses`, `cohorts`, `enrollments`, `sprints`, `classes`, `assignments`, `links`, `deliveries`, `reviews`, `inquiries` e `inquiry_responses`.

#### Scenario: Relation traversal
- **WHEN** una vista necesita curso, cohorte, inscripción, autor, estudiante, docente o contexto relacionado
- **THEN** el sistema SHALL solicitar las relaciones necesarias sin ampliar el acceso más allá de la cohorte autorizada

### Requirement: Data access rules
El sistema SHALL usar reglas PocketBase como límite final de autorización por colección y cohorte y SHALL mantenerlas alineadas con los controles de rol, inscripción y propiedad de la aplicación.

#### Scenario: Server check and database rule disagree
- **WHEN** una acción pasa su control local pero PocketBase no autoriza rol, inscripción o cohorte
- **THEN** la operación SHALL fallar sin persistir cambios y la discrepancia SHALL considerarse deriva de configuración

#### Scenario: Direct cross-cohort API request
- **WHEN** un usuario no administrador consulta directamente PocketBase por registros de una cohorte ajena
- **THEN** las reglas SHALL impedir que los registros sean listados, vistos o mutados

### Requirement: Read caching
El sistema SHALL aplicar memoización por solicitud y caché breve con claves que incluyan la cohorte a los listados de sprints y participantes.

#### Scenario: Cached sprint read
- **WHEN** se solicitan repetidamente los sprints dentro de la ventana de 30 segundos para la misma sesión y cohorte
- **THEN** el sistema MAY reutilizar el resultado cacheado

#### Scenario: Cached participant read
- **WHEN** se solicitan repetidamente participantes dentro de la ventana de 60 segundos para la misma sesión y cohorte
- **THEN** el sistema MAY reutilizar el resultado cacheado

#### Scenario: Different cohort read
- **WHEN** el mismo usuario cambia a otra cohorte
- **THEN** el sistema SHALL usar una entrada de caché diferente y SHALL no devolver datos de la cohorte anterior

## ADDED Requirements

### Requirement: Cohort relation integrity
El sistema SHALL mantener relaciones obligatorias e índices que impidan registros académicos huérfanos o asociaciones ambiguas entre cohortes.

#### Scenario: Sprint without cohort
- **WHEN** se intenta crear un sprint sin cohorte
- **THEN** PocketBase SHALL rechazar el registro

#### Scenario: Duplicate enrollment
- **WHEN** se intenta persistir dos inscripciones para el mismo usuario y cohorte
- **THEN** PocketBase SHALL rechazar la segunda mediante un índice único

### Requirement: Cohort-aware mutation revalidation
El sistema SHALL invalidar únicamente los listados y detalles afectados dentro del contexto de la cohorte después de una mutación exitosa.

#### Scenario: Cohort content mutated
- **WHEN** cambia contenido de una cohorte
- **THEN** el sistema SHALL refrescar las vistas relacionadas de esa cohorte sin contaminar el estado cacheado de otras
