# Academic Content Specification

## Purpose

Define la organización del curso en sprints, clases, trabajos prácticos y recursos vinculados.

## Requirements

### Requirement: Sprint catalog
El sistema SHALL listar los sprints persistidos, ordenados por creación, mostrando título, descripción y rango de fechas cuando esté disponible.

#### Scenario: Authenticated user views sprints
- **WHEN** un usuario abre `/sprints`
- **THEN** el sistema SHALL mostrar todos los sprints accesibles según las reglas de PocketBase

#### Scenario: No sprints exist
- **WHEN** no existen sprints accesibles
- **THEN** el sistema SHALL mostrar un estado vacío apropiado para el rol

### Requirement: Sprint administration
El sistema SHALL permitir a docentes y administradores crear, editar y eliminar sprints.

#### Scenario: Create sprint
- **WHEN** un docente o administrador envía un título y fechas válidas
- **THEN** el sistema SHALL crear el sprint y revalidar el catálogo

#### Scenario: Unauthorized sprint mutation
- **WHEN** un estudiante intenta mutar un sprint
- **THEN** el sistema SHALL rechazar la operación

### Requirement: Sprint detail
El sistema SHALL mostrar el título, descripción, fechas, clases y trabajos prácticos asociados a un sprint.

#### Scenario: Existing sprint
- **WHEN** un usuario abre `/sprints/{id}` con un identificador válido
- **THEN** el sistema SHALL cargar clases y trabajos prácticos relacionados

#### Scenario: Missing sprint
- **WHEN** el sprint no existe o no puede recuperarse
- **THEN** el sistema SHALL responder con página no encontrada

### Requirement: Class management
El sistema SHALL permitir a docentes y administradores crear, editar y eliminar clases dentro de un sprint, con título, descripción y fecha opcional.

#### Scenario: Student views a class
- **WHEN** un estudiante abre una clase
- **THEN** el sistema SHALL mostrar su contenido, fecha, recursos y consultas sin controles administrativos

#### Scenario: Teacher manages a class
- **WHEN** un docente o administrador abre una clase
- **THEN** el sistema SHALL ofrecer controles de edición, eliminación y gestión de recursos

### Requirement: Assignment management
El sistema SHALL permitir a docentes y administradores crear, editar y eliminar trabajos prácticos asociados a un sprint.

#### Scenario: Rich assignment description
- **WHEN** se guarda una descripción enriquecida para un trabajo práctico
- **THEN** el sistema SHALL conservarla y renderizarla como contenido HTML en el detalle

#### Scenario: Student views assignment
- **WHEN** un estudiante abre un trabajo práctico
- **THEN** el sistema SHALL mostrar su contenido, enlaces, consultas y estado de entrega

### Requirement: Contextual resource links
El sistema SHALL permitir asociar enlaces externos a una clase o a un trabajo práctico.

#### Scenario: Create contextual link
- **WHEN** un docente o administrador proporciona título, URL y exactamente un contexto padre
- **THEN** el sistema SHALL crear el enlace y mostrarlo en el detalle correspondiente

#### Scenario: Open external resource
- **WHEN** un usuario activa un recurso
- **THEN** el sistema SHALL abrir la URL en una pestaña nueva con aislamiento del contexto de origen

### Requirement: Content mutation consistency
El sistema SHALL revalidar las rutas afectadas después de crear, actualizar o eliminar contenido académico.

#### Scenario: Successful content mutation
- **WHEN** PocketBase confirma una mutación
- **THEN** el sistema SHALL refrescar las vistas de listado y detalle relacionadas
