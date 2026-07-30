# Review Scheduling and Evaluation Specification

## Purpose

Define la creación de turnos de revisión, sus reservas y la evaluación y retroalimentación de estudiantes por sprint.

## Requirements

### Requirement: Sprint review navigation
El sistema SHALL presentar los sprints disponibles para ingresar a sus turnos de revisión y, para estudiantes, SHALL mostrar el estado de evaluación correspondiente.

#### Scenario: Student without evaluation
- **WHEN** un estudiante no tiene revisión asociada al sprint
- **THEN** el estado mostrado SHALL ser `Pendiente`

### Requirement: Batch slot creation
El sistema SHALL permitir a docentes y administradores generar entre 1 y 50 turnos consecutivos para un sprint.

#### Scenario: Generate slots
- **WHEN** se proporciona inicio, duración mínima de cinco minutos y cantidad válida
- **THEN** el sistema SHALL crear cada turno con docente, hora inicial y hora final

#### Scenario: Scheduled breaks
- **WHEN** se configura duración y frecuencia de descanso positivas
- **THEN** el sistema SHALL insertar el descanso después de cada cantidad configurada de turnos, excepto después del último

#### Scenario: Shared location
- **WHEN** se proporciona enlace de reunión o sala
- **THEN** el sistema SHALL aplicarlos a todos los turnos del lote

### Requirement: Single booking per sprint
El sistema SHALL permitir que cada estudiante reserve como máximo un turno por sprint.

#### Scenario: Book available slot
- **WHEN** un estudiante sin reserva confirma un turno disponible
- **THEN** el sistema SHALL asignar su identificador al turno

#### Scenario: Book occupied slot
- **WHEN** un estudiante intenta reservar un turno ya asignado
- **THEN** el sistema SHALL rechazar la reserva

#### Scenario: Second booking in sprint
- **WHEN** un estudiante ya tiene una reserva en el sprint
- **THEN** el sistema SHALL rechazar cualquier reserva adicional

### Requirement: Booking cancellation
El sistema SHALL permitir al estudiante cancelar su propia reserva y a docentes o administradores liberar cualquier reserva.

#### Scenario: Student cancels own booking
- **WHEN** el propietario confirma la cancelación
- **THEN** el sistema SHALL dejar vacío el campo `student` del turno

#### Scenario: Student cancels another booking
- **WHEN** un estudiante intenta cancelar una reserva ajena
- **THEN** el sistema SHALL rechazar la operación

### Requirement: Slot administration
El sistema SHALL permitir a docentes y administradores eliminar turnos y acceder al detalle de turnos reservados.

#### Scenario: Delete slot
- **WHEN** un docente o administrador confirma la eliminación
- **THEN** el sistema SHALL eliminar el turno y refrescar el sprint de revisiones

### Requirement: Evaluation recording
El sistema SHALL permitir a docentes y administradores registrar o actualizar una evaluación por estudiante y sprint con estado, nota privada y devolución pública.

#### Scenario: Existing evaluation
- **WHEN** existe un registro de revisión para el estudiante
- **THEN** el sistema SHALL actualizar sus notas y estado

#### Scenario: Evaluation without prior slot
- **WHEN** no existe un registro de revisión
- **THEN** el sistema SHALL crear uno vinculado al sprint, docente y estudiante

#### Scenario: Supported evaluation status
- **WHEN** se guarda una evaluación
- **THEN** su estado SHALL ser uno de `Aprobado`, `Pendiente`, `No presentó` o `Desaprobado`

### Requirement: Review note privacy
El sistema SHALL mostrar la nota privada únicamente a docentes y administradores, y la devolución pública al estudiante propietario.

#### Scenario: Student opens own review detail
- **WHEN** un estudiante abre su propio turno
- **THEN** el sistema SHALL mostrar fecha, docente, ubicación, estado y devolución pública sin exponer `private_note`

#### Scenario: Student opens another review detail
- **WHEN** un estudiante intenta abrir el detalle de una revisión ajena
- **THEN** el sistema SHALL mostrar acceso denegado

### Requirement: Student-focused slot list
El sistema SHALL mostrar a un estudiante todos los turnos cuando no tiene reserva y únicamente su turno cuando ya reservó uno.

#### Scenario: Student already booked
- **WHEN** el estudiante abre el sprint de revisiones con una reserva existente
- **THEN** el sistema SHALL presentar su reserva y permitir cancelarla o abrir su detalle
