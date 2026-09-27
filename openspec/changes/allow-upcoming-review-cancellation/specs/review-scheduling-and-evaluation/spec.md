## MODIFIED Requirements

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
