## Purpose

Controla quién participa en cada cohorte, con qué función lo hace y qué información académica puede consultar o modificar dentro de ella.

## ADDED Requirements

### Requirement: Cohort enrollment record
El sistema SHALL relacionar un usuario y una cohorte mediante una inscripción única con rol de cohorte `estudiante` o `docente` y estado `activa` o `inactiva`.

#### Scenario: Create enrollment
- **WHEN** una persona autorizada inscribe un usuario que aún no participa en la cohorte
- **THEN** el sistema SHALL crear una inscripción activa con el rol seleccionado

#### Scenario: Duplicate enrollment
- **WHEN** se intenta crear otra inscripción para el mismo usuario y cohorte
- **THEN** el sistema SHALL rechazarla mediante una restricción única

### Requirement: Global and cohort role consistency
El sistema SHALL impedir que una inscripción otorgue capacidades superiores al rol global del usuario, excepto que un administrador global conserva acceso administrativo a todas las cohortes.

#### Scenario: Student assigned teacher cohort role
- **WHEN** se intenta asignar rol de cohorte `docente` a un usuario global `estudiante`
- **THEN** el sistema SHALL rechazar la asignación

#### Scenario: Global administrator without enrollment
- **WHEN** un administrador accede a una cohorte sin inscripción propia
- **THEN** el sistema SHALL permitir el acceso administrativo

### Requirement: Enrollment administration
El sistema SHALL permitir a administradores gestionar todas las inscripciones y a docentes gestionar estudiantes en cohortes donde tengan inscripción docente activa.

#### Scenario: Teacher enrolls student
- **WHEN** un docente autorizado agrega un usuario global `estudiante` a su cohorte
- **THEN** el sistema SHALL crear o reactivar su inscripción como estudiante

#### Scenario: Teacher attempts to manage teachers
- **WHEN** un docente intenta agregar, cambiar o desactivar una inscripción docente
- **THEN** el sistema SHALL rechazar la operación y reservarla a administradores

### Requirement: Enrollment-based access
El sistema SHALL requerir una inscripción activa en la cohorte para el acceso de estudiantes y docentes a sus datos académicos.

#### Scenario: Active member accesses cohort
- **WHEN** un usuario tiene una inscripción activa compatible con su rol global
- **THEN** el sistema SHALL permitir las vistas y acciones autorizadas para ese rol

#### Scenario: User accesses unrelated cohort
- **WHEN** un usuario no administrador intenta acceder a una cohorte sin inscripción activa
- **THEN** el sistema SHALL denegar el acceso sin revelar sus datos

### Requirement: Enrollment deactivation
El sistema SHALL desactivar inscripciones sin eliminar la actividad histórica producida por el participante.

#### Scenario: Student enrollment deactivated
- **WHEN** una persona autorizada desactiva una inscripción
- **THEN** el usuario SHALL perder acceso futuro a la cohorte y sus entregas, consultas y evaluaciones SHALL conservarse

### Requirement: Multi-cohort participation
El sistema SHALL permitir que un usuario participe simultánea o históricamente en múltiples cohortes.

#### Scenario: User belongs to multiple cohorts
- **WHEN** existen varias inscripciones activas para el usuario
- **THEN** el sistema SHALL ofrecer todas esas cohortes en el selector sin mezclar sus datos
