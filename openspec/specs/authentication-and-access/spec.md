# Authentication and Access Specification

## Purpose

Define el inicio y cierre de sesión, la propagación de la sesión entre cliente y servidor y la experiencia de navegación basada en roles.

## Requirements

### Requirement: Google OAuth authentication
El sistema SHALL permitir que una persona inicie sesión mediante el proveedor Google configurado en la colección `users` de PocketBase.

#### Scenario: Successful sign-in
- **WHEN** una persona completa correctamente el flujo OAuth de Google
- **THEN** el sistema SHALL persistir la sesión de PocketBase en la cookie `pb_auth` y redirigirla al inicio

#### Scenario: Failed sign-in
- **WHEN** el flujo OAuth falla
- **THEN** el sistema SHALL mantener a la persona en la pantalla de acceso y mostrar un error

### Requirement: Default student role
El sistema SHALL asignar el rol `estudiante` a una cuenta autenticada que todavía no tenga rol.

#### Scenario: First sign-in without role
- **WHEN** Google autentica un registro de usuario cuyo campo `role` está vacío
- **THEN** el sistema SHALL actualizar el registro con `role = "estudiante"` antes de continuar

### Requirement: Protected application routes
El sistema SHALL exigir una cookie `pb_auth` para acceder a las rutas de la aplicación distintas de `/login` y de los recursos excluidos por el proxy.

#### Scenario: Anonymous navigation
- **WHEN** una solicitud sin cookie `pb_auth` intenta abrir una ruta protegida
- **THEN** el sistema SHALL redirigirla a `/login`

#### Scenario: Authenticated login navigation
- **WHEN** una solicitud con cookie `pb_auth` abre `/login`
- **THEN** el sistema SHALL redirigirla a `/`

### Requirement: Server-side session consumption
El sistema SHALL cargar la cookie `pb_auth` en un cliente PocketBase aislado para cada operación renderizada o ejecutada en el servidor.

#### Scenario: Valid authenticated request
- **WHEN** una acción o página de servidor recibe una cookie válida
- **THEN** el sistema SHALL identificar al usuario actual y aplicar sus permisos

#### Scenario: Invalid or absent session
- **WHEN** la cookie no existe o la sesión no es válida
- **THEN** el sistema SHALL tratar la solicitud como no autenticada

### Requirement: Role-specific home experience
El sistema SHALL presentar navegación diferenciada para `estudiante`, `docente` y `admin`.

#### Scenario: Student home
- **WHEN** el usuario actual tiene rol `estudiante`
- **THEN** el inicio SHALL ofrecer acceso a sprints, revisiones y consultas

#### Scenario: Teacher or administrator home
- **WHEN** el usuario actual tiene rol `docente` o `admin`
- **THEN** el inicio SHALL ofrecer gestión de sprints, revisiones, estudiantes y consultas

### Requirement: Logout
El sistema SHALL permitir cerrar la sesión desde el encabezado.

#### Scenario: User logs out
- **WHEN** el usuario activa “Cerrar Sesión”
- **THEN** el sistema SHALL limpiar el almacén de autenticación y la cookie `pb_auth`, redirigir a `/login` y refrescar la aplicación

### Requirement: Defense-in-depth authorization
El sistema SHALL validar roles y propiedad en las acciones de servidor además de depender de las reglas API de PocketBase.

#### Scenario: Unauthorized mutation
- **WHEN** un usuario intenta ejecutar una mutación que su rol o propiedad no autoriza
- **THEN** el sistema SHALL rechazar la operación sin modificar datos
