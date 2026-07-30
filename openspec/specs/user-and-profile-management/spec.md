# User and Profile Management Specification

## Purpose

Define la consulta y administración de usuarios, sus roles y los datos editables del perfil personal.

## Requirements

### Requirement: Supported user roles
El sistema SHALL reconocer exclusivamente los roles `admin`, `docente` y `estudiante` para determinar capacidades de aplicación.

#### Scenario: Role-dependent authorization
- **WHEN** una operación protegida evalúa un usuario
- **THEN** el sistema SHALL usar el valor persistido en `users.role`

### Requirement: Personal profile view
El sistema SHALL cargar el registro actualizado del usuario autenticado al abrir `/profile`.

#### Scenario: Profile record exists
- **WHEN** un usuario autenticado abre su perfil
- **THEN** el sistema SHALL mostrar su email y sus datos personales disponibles

#### Scenario: Profile record is missing
- **WHEN** la sesión es válida pero el registro ya no existe
- **THEN** el sistema SHALL responder con página no encontrada

### Requirement: Personal profile editing
El sistema SHALL permitir que un usuario edite sus nombres, apellidos, DNI, fecha de nacimiento y teléfono, sin permitir que cambie su email desde este formulario.

#### Scenario: Complete name supplied
- **WHEN** el usuario guarda nombre y apellido no vacíos
- **THEN** el sistema SHALL actualizar también `name` con ambos valores concatenados

#### Scenario: Birth date cleared
- **WHEN** el usuario guarda una fecha de nacimiento vacía
- **THEN** el sistema SHALL persistir `birthDate` como nulo

#### Scenario: Editing another profile
- **WHEN** un usuario no administrador intenta actualizar un perfil ajeno
- **THEN** el sistema SHALL rechazar la operación

### Requirement: Administrator user directory
El sistema SHALL restringir `/admin/users` a administradores y mostrar allí los usuarios con identidad, email, avatar y rol.

#### Scenario: Non-administrator access
- **WHEN** un usuario sin rol `admin` intenta abrir el directorio
- **THEN** el sistema SHALL redirigirlo al inicio

### Requirement: Administrator role assignment
El sistema SHALL permitir que un administrador cambie el rol de cualquier usuario a uno de los roles soportados.

#### Scenario: Authorized role update
- **WHEN** un administrador selecciona un rol para un usuario
- **THEN** el sistema SHALL persistir el rol y revalidar el directorio de usuarios

#### Scenario: Unauthorized role update
- **WHEN** un usuario no administrador intenta cambiar roles
- **THEN** el sistema SHALL rechazar la acción
