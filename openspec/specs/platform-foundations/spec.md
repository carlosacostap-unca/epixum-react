# Platform Foundations Specification

## Purpose

Define las bases de ejecución, persistencia, renderizado y consistencia compartidas por las capacidades de la plataforma educativa.

## Requirements

### Requirement: Next.js application runtime
El sistema SHALL ejecutarse como una aplicación Next.js con React y TypeScript sobre Node.js compatible con el requisito declarado por el proyecto.

#### Scenario: Production build
- **WHEN** se ejecuta `npm run build` con las variables requeridas
- **THEN** Next.js SHALL compilar las rutas, componentes cliente y componentes servidor

### Requirement: PocketBase persistence
El sistema SHALL usar `NEXT_PUBLIC_POCKETBASE_URL` como origen de persistencia y autenticación para clientes de navegador y servidor.

#### Scenario: Missing PocketBase URL
- **WHEN** el entorno de servidor no define la URL
- **THEN** el sistema SHALL registrar un error crítico de configuración

### Requirement: Active educational data model
El sistema SHALL persistir las capacidades web mediante las colecciones activas `users`, `sprints`, `classes`, `assignments`, `links`, `deliveries`, `reviews`, `inquiries` e `inquiry_responses`.

#### Scenario: Relation traversal
- **WHEN** una vista necesita autor, estudiante, docente o contexto relacionado
- **THEN** el sistema SHALL solicitar las expansiones PocketBase necesarias

### Requirement: Data access rules
El sistema SHALL usar reglas PocketBase como límite final de autorización para cada colección y SHALL mantener esas reglas alineadas con los controles de rol de la aplicación.

#### Scenario: Server check and database rule disagree
- **WHEN** una acción pasa su control local pero PocketBase no autoriza el rol
- **THEN** la operación SHALL fallar sin persistir cambios y la discrepancia SHALL considerarse deriva de configuración

### Requirement: Read caching
El sistema SHALL aplicar memoización por solicitud y caché breve a los listados de sprints y usuarios para reducir solicitudes repetidas a PocketBase.

#### Scenario: Cached sprint read
- **WHEN** se solicitan repetidamente los sprints dentro de la ventana de 30 segundos para la misma sesión
- **THEN** el sistema MAY reutilizar el resultado cacheado

#### Scenario: Cached user read
- **WHEN** se solicitan repetidamente usuarios o estudiantes dentro de la ventana de 60 segundos para la misma sesión
- **THEN** el sistema MAY reutilizar el resultado cacheado

### Requirement: Mutation revalidation
El sistema SHALL revalidar las rutas afectadas después de mutaciones exitosas para evitar presentar información obsoleta.

#### Scenario: Related detail mutation
- **WHEN** cambia un recurso hijo como enlace, entrega, consulta o revisión
- **THEN** el sistema SHALL revalidar el detalle padre correspondiente

### Requirement: Safe external navigation
El sistema SHALL abrir enlaces externos en una pestaña nueva utilizando `noopener noreferrer`.

#### Scenario: External resource opened
- **WHEN** un usuario abre un repositorio, recurso o reunión
- **THEN** la nueva página SHALL no recibir acceso al contexto `window.opener`

### Requirement: Empty and failure states
El sistema SHALL presentar estados comprensibles cuando una colección no tenga datos, un registro no exista o una operación falle.

#### Scenario: Missing detail record
- **WHEN** no puede recuperarse el recurso solicitado
- **THEN** la vista SHALL responder con no encontrado o un mensaje de acceso/error específico según el caso
