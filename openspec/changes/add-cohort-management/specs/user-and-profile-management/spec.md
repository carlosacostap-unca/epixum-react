## ADDED Requirements

### Requirement: Cohort student directory
El sistema SHALL mostrar a docentes y administradores el directorio de estudiantes de la cohorte activa en lugar de todos los usuarios globales.

#### Scenario: Teacher opens student management
- **WHEN** un docente abre estudiantes dentro de una cohorte asignada
- **THEN** el sistema SHALL listar únicamente inscripciones estudiantiles activas de esa cohorte y sus evaluaciones de esa cohorte

#### Scenario: Administrator opens global user administration
- **WHEN** un administrador abre `/admin/users`
- **THEN** el sistema SHALL conservar el directorio global para gestionar identidad y rol global, separado de las inscripciones

### Requirement: Participant management entry point
El sistema SHALL ofrecer desde la cohorte una vista para agregar, reactivar o desactivar participantes según los permisos de inscripción.

#### Scenario: Enrollment changed
- **WHEN** una persona autorizada cambia la participación de un usuario
- **THEN** el directorio de la cohorte SHALL reflejar el nuevo estado sin cambiar automáticamente su rol global
