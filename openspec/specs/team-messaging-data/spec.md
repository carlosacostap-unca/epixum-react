# Team Messaging Data Specification

## Purpose

Define el contrato de datos PocketBase existente para equipos y mensajes, actualmente disponible sin interfaz web en esta aplicación.

## Requirements

### Requirement: Team records
El sistema SHALL representar un equipo mediante un nombre obligatorio y una relación múltiple opcional de miembros de `users`.

#### Scenario: Authenticated team discovery
- **WHEN** un usuario autenticado consulta equipos mediante PocketBase
- **THEN** el sistema SHALL permitir listar y ver los registros accesibles

### Requirement: Team administration
El sistema SHALL permitir crear, actualizar y eliminar equipos únicamente a docentes o administradores.

#### Scenario: Student team mutation
- **WHEN** un estudiante intenta mutar un equipo
- **THEN** PocketBase SHALL rechazar la operación

### Requirement: Team messages
El sistema SHALL representar cada mensaje con texto obligatorio, equipo obligatorio, remitente relacionado y marcas de creación y actualización.

#### Scenario: Member reads team messages
- **WHEN** el usuario pertenece al equipo del mensaje
- **THEN** PocketBase SHALL permitir listar y ver ese mensaje

#### Scenario: Non-member reads team messages
- **WHEN** un usuario que no es docente ni miembro intenta leer mensajes del equipo
- **THEN** PocketBase SHALL rechazar el acceso

### Requirement: Message creation
El sistema SHALL permitir crear mensajes a miembros del equipo y a docentes conforme a las reglas activas de PocketBase.

#### Scenario: Authorized sender
- **WHEN** un miembro del equipo o docente crea un mensaje válido
- **THEN** PocketBase SHALL persistirlo asociado al equipo

### Requirement: Message mutation
El sistema SHALL restringir la actualización y eliminación de mensajes a administradores.

#### Scenario: Non-administrator mutation
- **WHEN** un usuario sin rol `admin` intenta actualizar o eliminar un mensaje
- **THEN** PocketBase SHALL rechazar la operación

### Requirement: No web interface commitment
La aplicación web SHALL tratar equipos y mensajes como una capacidad de backend hasta que una futura especificación agregue rutas y componentes de interfaz.

#### Scenario: Current navigation
- **WHEN** un usuario navega por la aplicación actual
- **THEN** el sistema SHALL no prometer una pantalla de equipos o chat
