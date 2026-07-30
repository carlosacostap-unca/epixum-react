# Assignment Deliveries Specification

## Purpose

Define la entrega de repositorios por estudiantes y su consulta por docentes y administradores.

## Requirements

### Requirement: One delivery per student and assignment
El sistema SHALL conservar como máximo una entrega por combinación de trabajo práctico y estudiante.

#### Scenario: First delivery
- **WHEN** un estudiante autenticado envía una entrega para un trabajo práctico sin entrega previa
- **THEN** el sistema SHALL crearla vinculada al estudiante actual

#### Scenario: Duplicate delivery
- **WHEN** se intenta crear otra entrega para la misma combinación
- **THEN** el sistema SHALL rechazarla mediante la restricción única de PocketBase

### Requirement: Multiple repository URLs
El sistema SHALL aceptar una o más URLs de repositorio en una entrega y persistirlas como una lista JSON compatible con entregas históricas de URL única.

#### Scenario: URL without scheme
- **WHEN** el estudiante ingresa una URL sin protocolo
- **THEN** el sistema SHALL normalizarla con `https://`

#### Scenario: Empty URL list
- **WHEN** no queda ninguna URL no vacía
- **THEN** el sistema SHALL impedir el envío y mostrar un error

### Requirement: Student delivery editing
El sistema SHALL permitir que un estudiante modifique las URLs de su entrega existente.

#### Scenario: Existing delivery edited
- **WHEN** el propietario guarda una lista válida de repositorios
- **THEN** el sistema SHALL actualizar la entrega y conservar su relación con el trabajo y el estudiante

#### Scenario: Non-owner update
- **WHEN** un estudiante intenta actualizar una entrega ajena
- **THEN** PocketBase SHALL rechazar la operación por sus reglas de acceso

### Requirement: Delivery status presentation
El sistema SHALL mostrar al estudiante si el trabajo está pendiente o entregado, las URLs registradas y la fecha original de entrega.

#### Scenario: Existing delivery displayed
- **WHEN** el estudiante abre un trabajo con entrega propia
- **THEN** el sistema SHALL mostrar el estado entregado y ofrecer modificarla

### Requirement: Teacher delivery overview
El sistema SHALL permitir que docentes y administradores vean todas las entregas de un trabajo práctico con estudiante, repositorios y fecha.

#### Scenario: Search deliveries
- **WHEN** un docente filtra por nombre o email del estudiante
- **THEN** la tabla SHALL mostrar únicamente coincidencias sin modificar los datos persistidos

### Requirement: Delivery access control
El sistema SHALL permitir crear entregas solo a estudiantes; leerlas al propietario, docentes y administradores; y actualizarlas al propietario o administrador.

#### Scenario: Teacher attempts student submission
- **WHEN** un docente intenta crear una entrega mediante la acción de estudiante
- **THEN** el sistema SHALL rechazarla
