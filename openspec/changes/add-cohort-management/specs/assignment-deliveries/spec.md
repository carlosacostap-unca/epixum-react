## MODIFIED Requirements

### Requirement: Teacher delivery overview
El sistema SHALL permitir que docentes inscritos en la cohorte del trabajo y administradores vean las entregas de ese trabajo práctico con estudiante, repositorios y fecha.

#### Scenario: Search deliveries
- **WHEN** un docente autorizado filtra por nombre o email del estudiante
- **THEN** la tabla SHALL mostrar únicamente coincidencias de estudiantes inscritos en esa cohorte sin modificar datos persistidos

#### Scenario: Teacher from another cohort
- **WHEN** un docente no inscrito intenta consultar entregas del trabajo
- **THEN** el sistema SHALL denegar el acceso

### Requirement: Delivery access control
El sistema SHALL permitir crear y leer una entrega a un estudiante solo si tiene inscripción activa en la cohorte del trabajo; SHALL permitir leerlas a docentes inscritos en esa cohorte y administradores; y SHALL permitir actualizarlas al propietario o administrador.

#### Scenario: Teacher attempts student submission
- **WHEN** un docente intenta crear una entrega mediante la acción de estudiante
- **THEN** el sistema SHALL rechazarla

#### Scenario: Student from another cohort
- **WHEN** un estudiante intenta crear o consultar una entrega para un trabajo de una cohorte ajena
- **THEN** el sistema SHALL rechazar la operación

#### Scenario: Enrollment deactivated after delivery
- **WHEN** se desactiva la inscripción de un estudiante que ya entregó
- **THEN** el sistema SHALL conservar la entrega pero SHALL impedir que el estudiante vuelva a consultarla o modificarla
