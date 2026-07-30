## Purpose

Permite reutilizar la definición de un curso en múltiples ediciones independientes y administrar el ciclo de vida y contexto activo de cada cohorte.

## ADDED Requirements

### Requirement: Reusable course definition
El sistema SHALL representar un curso reutilizable con nombre, descripción y estado, separado de las fechas y participantes de una cohorte.

#### Scenario: Administrator creates a course
- **WHEN** un administrador guarda un nombre válido para un nuevo curso
- **THEN** el sistema SHALL crear una definición de curso disponible para crear cohortes

#### Scenario: Non-administrator mutates a course
- **WHEN** un usuario sin rol global `admin` intenta crear, editar o archivar un curso
- **THEN** el sistema SHALL rechazar la operación

### Requirement: Cohort lifecycle
El sistema SHALL representar cada cohorte con curso, nombre, fecha inicial, fecha final y estado `planificada`, `activa` o `archivada`.

#### Scenario: Create planned cohort
- **WHEN** un docente o administrador crea una cohorte con curso, nombre y período válidos
- **THEN** el sistema SHALL persistirla inicialmente como `planificada`

#### Scenario: Invalid date range
- **WHEN** la fecha final precede a la fecha inicial
- **THEN** el sistema SHALL rechazar la cohorte con un error de validación

#### Scenario: Activate cohort
- **WHEN** una persona autorizada activa una cohorte planificada
- **THEN** el sistema SHALL permitir actividad académica dentro de ella

#### Scenario: Archive cohort
- **WHEN** una persona autorizada archiva una cohorte
- **THEN** el sistema SHALL conservar su historial en modo de solo lectura

### Requirement: Cohort administration
El sistema SHALL permitir a administradores gestionar todas las cohortes y a docentes gestionar aquellas en las que tienen una inscripción docente activa.

#### Scenario: Teacher manages assigned cohort
- **WHEN** un docente inscrito como docente edita una cohorte no archivada
- **THEN** el sistema SHALL permitir la actualización

#### Scenario: Teacher manages unrelated cohort
- **WHEN** un docente intenta editar una cohorte donde no está inscrito
- **THEN** el sistema SHALL rechazar la operación

### Requirement: Active cohort selection
El sistema SHALL resolver una cohorte activa para contextualizar la navegación y las operaciones académicas.

#### Scenario: User has one accessible cohort
- **WHEN** el usuario tiene exactamente una cohorte accesible
- **THEN** el sistema SHALL seleccionarla automáticamente

#### Scenario: User has multiple accessible cohorts
- **WHEN** el usuario tiene más de una cohorte accesible
- **THEN** el sistema SHALL mostrar un selector y recordar una selección válida durante la navegación

#### Scenario: Previously selected cohort is no longer accessible
- **WHEN** la cohorte recordada fue archivada para escritura o la inscripción dejó de estar activa
- **THEN** el sistema SHALL seleccionar otra cohorte accesible o mostrar un estado sin cohorte

### Requirement: Cohort switch isolation
El sistema SHALL cambiar en conjunto el alcance de sprints, estudiantes, revisiones, entregas y consultas al seleccionar otra cohorte.

#### Scenario: Switch cohort
- **WHEN** el usuario selecciona una cohorte diferente
- **THEN** el sistema SHALL navegar a una vista válida de esa cohorte y SHALL no conservar datos visibles de la cohorte anterior

### Requirement: Empty cohort state
El sistema SHALL presentar una experiencia administrable cuando una cohorte todavía no tiene sprints ni actividad.

#### Scenario: New active cohort
- **WHEN** una persona autorizada abre una cohorte activa sin sprints
- **THEN** el sistema SHALL mostrar un estado vacío y la acción para crear su primer sprint

### Requirement: Existing data migration
El sistema SHALL migrar los datos académicos actuales a un curso “React” y una cohorte inicial sin cambiar identificadores ni romper relaciones existentes.

#### Scenario: First migration run
- **WHEN** la migración encuentra sprints sin cohorte
- **THEN** el sistema SHALL crear o reutilizar el curso y cohorte iniciales y asociar todos esos sprints y consultas heredadas

#### Scenario: Repeated migration run
- **WHEN** la migración se ejecuta nuevamente
- **THEN** el sistema SHALL producir el mismo estado sin duplicar cursos, cohortes ni inscripciones

#### Scenario: Migration cannot resolve a relation
- **WHEN** un registro histórico no puede asociarse de forma segura
- **THEN** la migración SHALL detenerse e informar el registro sin eliminar ni sobrescribir datos
