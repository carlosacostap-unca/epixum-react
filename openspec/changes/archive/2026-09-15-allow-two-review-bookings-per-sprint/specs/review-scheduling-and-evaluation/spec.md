## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Sprint review navigation
El sistema SHALL presentar los sprints disponibles para ingresar a sus turnos de revisión y, para estudiantes, SHALL mostrar el estado de evaluación correspondiente. Cuando un estudiante tenga más de una revisión en el mismo sprint, el estado general SHALL corresponder a la revisión con fecha de inicio más reciente.

#### Scenario: Student without evaluation
- **WHEN** un estudiante no tiene revisión asociada al sprint
- **THEN** el estado mostrado SHALL ser `Pendiente`

#### Scenario: Student with two evaluations
- **WHEN** un estudiante tiene dos revisiones con veredictos distintos en el mismo sprint
- **THEN** el estado general mostrado SHALL ser el veredicto de la revisión cuyo inicio sea más reciente

### Requirement: Student-focused slot list
El sistema SHALL mostrar a un estudiante sus reservas actuales y los turnos que todavía puede reservar hasta alcanzar el máximo de dos por sprint.

#### Scenario: Student without bookings
- **WHEN** el estudiante abre un sprint sin reservas propias
- **THEN** el sistema SHALL mostrar los turnos disponibles y permitir reservar uno

#### Scenario: Student already booked
- **WHEN** el estudiante abre un sprint con una reserva propia
- **THEN** el sistema SHALL mostrar esa reserva, permitir cancelarla o abrir su detalle y mantener visibles los turnos disponibles para una segunda reserva

#### Scenario: Student with two bookings
- **WHEN** el estudiante abre un sprint con dos reservas propias
- **THEN** el sistema SHALL mostrar ambas reservas, permitir cancelar o abrir el detalle de cada una y no ofrecer una tercera reserva

#### Scenario: Student cancels one of two bookings
- **WHEN** el estudiante cancela cualquiera de sus dos reservas
- **THEN** el sistema SHALL conservar la otra reserva y volver a permitir una segunda reserva en un turno disponible

## REMOVED Requirements

### Requirement: Single booking per sprint
**Reason**: El máximo de una reserva se reemplaza por el nuevo límite de dos turnos distintos por estudiante y sprint.

**Migration**: Las reservas existentes permanecen sin cambios y cuentan como la primera reserva del estudiante en el sprint correspondiente.
