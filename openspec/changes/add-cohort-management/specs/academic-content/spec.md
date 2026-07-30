## MODIFIED Requirements

### Requirement: Sprint catalog
El sistema SHALL listar únicamente los sprints de la cohorte activa, ordenados por creación, mostrando título, descripción y rango de fechas cuando esté disponible.

#### Scenario: Authenticated user views sprints
- **WHEN** un usuario con acceso abre `/sprints` dentro de una cohorte activa
- **THEN** el sistema SHALL mostrar todos los sprints de esa cohorte y ninguno de otras cohortes

#### Scenario: No sprints exist
- **WHEN** la cohorte activa no tiene sprints accesibles
- **THEN** el sistema SHALL mostrar un estado vacío apropiado para el rol

### Requirement: Sprint administration
El sistema SHALL permitir a docentes inscritos en la cohorte activa y a administradores crear, editar y eliminar sprints dentro de esa cohorte.

#### Scenario: Create sprint
- **WHEN** un docente autorizado o administrador envía un título y fechas válidas
- **THEN** el sistema SHALL crear el sprint asociado obligatoriamente a la cohorte activa y revalidar su catálogo

#### Scenario: Unauthorized sprint mutation
- **WHEN** un estudiante o docente no inscrito intenta mutar un sprint
- **THEN** el sistema SHALL rechazar la operación

### Requirement: Sprint detail
El sistema SHALL mostrar el título, descripción, fechas, clases y trabajos prácticos de un sprint solo cuando pertenece a una cohorte accesible para el usuario.

#### Scenario: Existing sprint in active cohort
- **WHEN** un usuario abre `/sprints/{id}` y el sprint pertenece a su cohorte activa
- **THEN** el sistema SHALL cargar clases y trabajos prácticos relacionados

#### Scenario: Sprint from another cohort
- **WHEN** un usuario no administrador intenta abrir un sprint de otra cohorte mediante su identificador
- **THEN** el sistema SHALL denegar el acceso sin revelar su contenido

#### Scenario: Missing sprint
- **WHEN** el sprint no existe o no puede recuperarse
- **THEN** el sistema SHALL responder con página no encontrada

## ADDED Requirements

### Requirement: Inherited cohort boundary
El sistema SHALL derivar la cohorte de clases, trabajos prácticos y enlaces a través del sprint y SHALL aplicar esa frontera en lecturas y mutaciones.

#### Scenario: Cross-cohort child access
- **WHEN** un usuario intenta abrir o mutar una clase, trabajo práctico o enlace cuyo sprint pertenece a otra cohorte
- **THEN** el sistema SHALL rechazar el acceso

#### Scenario: Move content between cohorts
- **WHEN** se intenta reasignar directamente un contenido existente a un sprint de otra cohorte
- **THEN** el sistema SHALL rechazar la operación; la copia o migración de contenido requiere un flujo futuro explícito
