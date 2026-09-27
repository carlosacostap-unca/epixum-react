# Review Scheduling and Evaluation Specification

## Purpose

Define la creación de turnos de revisión, sus reservas y la evaluación y retroalimentación de estudiantes por sprint.

## Requirements

### Requirement: Sprint review navigation
El sistema SHALL presentar los sprints disponibles para ingresar a sus turnos de revisión y, para estudiantes, SHALL mostrar el estado de evaluación correspondiente. Cuando un estudiante tenga más de una revisión en el mismo sprint, el estado general SHALL corresponder a la revisión con fecha de inicio más reciente.

#### Scenario: Student without evaluation
- **WHEN** un estudiante no tiene revisión asociada al sprint
- **THEN** el estado mostrado SHALL ser `Pendiente`

#### Scenario: Student with two evaluations
- **WHEN** un estudiante tiene dos revisiones con veredictos distintos en el mismo sprint
- **THEN** el estado general mostrado SHALL ser el veredicto de la revisión cuyo inicio sea más reciente

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

### Requirement: Two bookings per sprint
El sistema SHALL permitir que cada estudiante mantenga como máximo dos reservas en turnos distintos de un mismo sprint.

#### Scenario: First booking in sprint
- **WHEN** un estudiante sin reservas selecciona un turno disponible del sprint
- **THEN** el sistema SHALL asignarle el turno

#### Scenario: Second booking in sprint
- **WHEN** un estudiante con una reserva selecciona otro turno disponible del mismo sprint
- **THEN** el sistema SHALL asignarle el segundo turno

#### Scenario: Third booking in sprint
- **WHEN** un estudiante que ya tiene dos reservas intenta reservar otro turno del mismo sprint
- **THEN** el sistema SHALL rechazar la operación sin modificar ningún turno

#### Scenario: Book occupied slot
- **WHEN** un estudiante intenta reservar un turno ya asignado
- **THEN** el sistema SHALL rechazar la reserva

### Requirement: Existing review preservation
El sistema SHALL conservar todos los registros de revisión existentes al habilitar el segundo turno por estudiante y sprint.

#### Scenario: Upgrade with existing bookings
- **WHEN** se aplica el cambio sobre una base que contiene turnos disponibles o reservados
- **THEN** el sistema SHALL conservar sus identificadores, sprint, docente, estudiante, horarios, ubicación, notas y veredictos sin reasignarlos ni eliminarlos

### Requirement: Booking cancellation
El sistema SHALL permitir al estudiante cancelar únicamente una reserva propia cuyo horario de inicio sea posterior al momento de la cancelación y que no contenga devolución pública, nota privada ni un veredicto distinto de `Pendiente`; al cancelarla SHALL liberar el turno para que otro estudiante pueda reservarlo. El sistema SHALL permitir a docentes o administradores liberar cualquier reserva.

#### Scenario: Student cancels own booking
- **WHEN** el propietario confirma la cancelación antes del horario de inicio de una reserva sin devolución pública, nota privada ni veredicto distinto de `Pendiente`
- **THEN** el sistema SHALL dejar vacíos los campos `student` y `bookingOrdinal` y SHALL mostrar el turno como disponible para otros estudiantes habilitados

#### Scenario: Student attempts to cancel a started or past booking
- **WHEN** el propietario intenta cancelar una reserva cuyo horario de inicio es igual o anterior al momento de la solicitud
- **THEN** el sistema SHALL rechazar la operación y SHALL conservar sin cambios la reserva

#### Scenario: Student attempts to cancel booking with public feedback
- **WHEN** el propietario intenta cancelar una reserva futura que contiene devolución pública
- **THEN** el sistema SHALL rechazar la operación y conservar sin cambios la reserva y su evaluación

#### Scenario: Student attempts to cancel booking with private note
- **WHEN** el propietario intenta cancelar una reserva futura que contiene una nota privada docente
- **THEN** el sistema SHALL rechazar la operación sin revelar el contenido de la nota privada y conservar sin cambios la reserva y su evaluación

#### Scenario: Student attempts to cancel booking with verdict
- **WHEN** el propietario intenta cancelar una reserva futura cuyo veredicto es distinto de `Pendiente`
- **THEN** el sistema SHALL rechazar la operación y conservar sin cambios la reserva y su evaluación

#### Scenario: Student cancels another booking
- **WHEN** un estudiante intenta cancelar una reserva ajena
- **THEN** el sistema SHALL rechazar la operación

#### Scenario: Teacher or administrator releases reviewed booking
- **WHEN** un docente habilitado o administrador confirma la liberación de una reserva iniciada, pasada o con contenido docente
- **THEN** el sistema SHALL permitir la operación conforme a sus permisos de gestión académica

### Requirement: Student-focused slot list
El sistema SHALL mostrar a un estudiante sus reservas actuales y los turnos que todavía puede reservar hasta alcanzar el máximo de dos por sprint, SHALL ofrecer la cancelación únicamente en reservas futuras elegibles y SHALL indicar cuándo una reserva está protegida por contenido docente o ya no puede cancelarse porque comenzó.

#### Scenario: Student without bookings
- **WHEN** el estudiante abre un sprint sin reservas propias
- **THEN** el sistema SHALL mostrar los turnos disponibles y permitir reservar uno

#### Scenario: Student already booked
- **WHEN** el estudiante abre un sprint con una reserva propia futura sin contenido docente
- **THEN** el sistema SHALL mostrar esa reserva, permitir cancelarla o abrir su detalle y mantener visibles los turnos disponibles para una segunda reserva

#### Scenario: Student already booked in a started or past slot
- **WHEN** el estudiante abre un sprint con una reserva propia cuyo horario de inicio es igual o anterior al momento actual
- **THEN** el sistema SHALL permitir abrir su detalle, no SHALL ofrecer la acción de cancelación y SHALL indicar que el turno ya comenzó

#### Scenario: Student already booked with teacher content
- **WHEN** el estudiante abre un sprint con una reserva propia que contiene devolución pública, nota privada o un veredicto distinto de `Pendiente`
- **THEN** el sistema SHALL mostrar la reserva como protegida, permitir abrir su detalle y no ofrecer la acción de cancelación

#### Scenario: Student with two bookings
- **WHEN** el estudiante abre un sprint con dos reservas propias
- **THEN** el sistema SHALL mostrar ambas reservas, permitir abrir el detalle de cada una, permitir cancelar solamente las reservas futuras no protegidas y no ofrecer una tercera reserva

#### Scenario: Student cancels one of two bookings
- **WHEN** el estudiante cancela una de sus dos reservas futuras que no contiene contenido docente
- **THEN** el sistema SHALL conservar la otra reserva, mostrar el turno cancelado como disponible y volver a permitir una segunda reserva en un turno disponible

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
