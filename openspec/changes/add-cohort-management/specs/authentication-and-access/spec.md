## ADDED Requirements

### Requirement: Authenticated cohort resolution
El sistema SHALL resolver la cohorte activa después de autenticar al usuario y antes de mostrar navegación académica contextual.

#### Scenario: Accessible cohort exists
- **WHEN** el usuario inicia sesión y tiene al menos una cohorte accesible
- **THEN** el sistema SHALL restaurar una selección válida o seleccionar automáticamente una cohorte

#### Scenario: No accessible cohort
- **WHEN** un usuario no administrador inicia sesión sin inscripciones activas
- **THEN** el sistema SHALL mostrar un estado sin cohorte y SHALL impedir el acceso a datos académicos

### Requirement: Cohort-aware navigation
El sistema SHALL mostrar la cohorte activa en el encabezado y permitir cambiarla cuando exista más de una opción accesible.

#### Scenario: Cohort selected
- **WHEN** existe una cohorte activa
- **THEN** los enlaces a sprints, revisiones, estudiantes y consultas SHALL conservar su contexto
