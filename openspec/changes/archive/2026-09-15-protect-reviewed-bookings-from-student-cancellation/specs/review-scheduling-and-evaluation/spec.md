## MODIFIED Requirements

### Requirement: Booking cancellation
El sistema SHALL permitir al estudiante cancelar únicamente una reserva propia que no contenga devolución pública, nota privada ni un veredicto distinto de `Pendiente`, y SHALL permitir a docentes o administradores liberar cualquier reserva.

#### Scenario: Student cancels own booking
- **WHEN** el propietario confirma la cancelación de una reserva sin devolución pública, nota privada ni veredicto distinto de `Pendiente`
- **THEN** el sistema SHALL dejar vacíos los campos `student` y `bookingOrdinal` del turno

#### Scenario: Student attempts to cancel booking with public feedback
- **WHEN** el propietario intenta cancelar una reserva que contiene devolución pública
- **THEN** el sistema SHALL rechazar la operación y conservar sin cambios la reserva y su evaluación

#### Scenario: Student attempts to cancel booking with private note
- **WHEN** el propietario intenta cancelar una reserva que contiene una nota privada docente
- **THEN** el sistema SHALL rechazar la operación sin revelar el contenido de la nota privada y conservar sin cambios la reserva y su evaluación

#### Scenario: Student attempts to cancel booking with verdict
- **WHEN** el propietario intenta cancelar una reserva cuyo veredicto es distinto de `Pendiente`
- **THEN** el sistema SHALL rechazar la operación y conservar sin cambios la reserva y su evaluación

#### Scenario: Student cancels another booking
- **WHEN** un estudiante intenta cancelar una reserva ajena
- **THEN** el sistema SHALL rechazar la operación

#### Scenario: Teacher or administrator releases reviewed booking
- **WHEN** un docente habilitado o administrador confirma la liberación de una reserva con contenido docente
- **THEN** el sistema SHALL permitir la operación conforme a sus permisos de gestión académica

### Requirement: Student-focused slot list
El sistema SHALL mostrar a un estudiante sus reservas actuales y los turnos que todavía puede reservar hasta alcanzar el máximo de dos por sprint, y SHALL indicar cuándo una reserva propia está protegida por contener contenido docente.

#### Scenario: Student without bookings
- **WHEN** el estudiante abre un sprint sin reservas propias
- **THEN** el sistema SHALL mostrar los turnos disponibles y permitir reservar uno

#### Scenario: Student already booked
- **WHEN** el estudiante abre un sprint con una reserva propia sin contenido docente
- **THEN** el sistema SHALL mostrar esa reserva, permitir cancelarla o abrir su detalle y mantener visibles los turnos disponibles para una segunda reserva

#### Scenario: Student already booked with teacher content
- **WHEN** el estudiante abre un sprint con una reserva propia que contiene devolución pública, nota privada o un veredicto distinto de `Pendiente`
- **THEN** el sistema SHALL mostrar la reserva como protegida, permitir abrir su detalle y no ofrecer la acción de cancelación

#### Scenario: Student with two bookings
- **WHEN** el estudiante abre un sprint con dos reservas propias
- **THEN** el sistema SHALL mostrar ambas reservas, permitir abrir el detalle de cada una, permitir cancelar solamente las que no estén protegidas y no ofrecer una tercera reserva

#### Scenario: Student cancels one of two bookings
- **WHEN** el estudiante cancela una de sus dos reservas que no contiene contenido docente
- **THEN** el sistema SHALL conservar la otra reserva y volver a permitir una segunda reserva en un turno disponible
