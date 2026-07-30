## ADDED Requirements

### Requirement: Cohort-scoped review access
El sistema SHALL limitar turnos, reservas y evaluaciones a integrantes activos de la cohorte a la que pertenece el sprint, con acceso global para administradores.

#### Scenario: Student views cohort reviews
- **WHEN** un estudiante abre revisiones con una cohorte activa
- **THEN** el sistema SHALL mostrar únicamente sprints y turnos de esa cohorte

#### Scenario: Teacher manages cohort reviews
- **WHEN** un docente con inscripción activa administra turnos o evaluaciones
- **THEN** el sistema SHALL limitar estudiantes y sprints a su cohorte activa

#### Scenario: Cross-cohort review identifier
- **WHEN** un usuario no administrador intenta abrir o mutar una revisión perteneciente a otra cohorte
- **THEN** el sistema SHALL denegar el acceso sin exponer notas públicas ni privadas

### Requirement: Atomic cohort booking constraint
El sistema SHALL hacer cumplir de forma atómica una única reserva por estudiante y sprint dentro de su cohorte.

#### Scenario: Concurrent booking attempts
- **WHEN** dos solicitudes intentan reservar turnos diferentes del mismo sprint para el mismo estudiante
- **THEN** como máximo una SHALL confirmarse y la otra SHALL recibir un conflicto
