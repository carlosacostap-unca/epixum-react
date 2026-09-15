## MODIFIED Requirements

### Requirement: Evaluation recording
El sistema SHALL permitir a docentes y administradores registrar o actualizar una evaluación por estudiante y sprint con estado, nota privada y devolución pública, y SHALL permitir completar esos datos en conjunto desde el detalle de una revisión existente.

#### Scenario: Existing evaluation
- **WHEN** existe un registro de revisión para el estudiante
- **THEN** el sistema SHALL actualizar sus notas y estado

#### Scenario: Evaluation without prior slot
- **WHEN** no existe un registro de revisión
- **THEN** el sistema SHALL crear uno vinculado al sprint, docente y estudiante

#### Scenario: Supported evaluation status
- **WHEN** se guarda una evaluación
- **THEN** su estado SHALL ser uno de `Aprobado`, `Pendiente`, `No presentó` o `Desaprobado`

#### Scenario: Evaluation from review detail
- **WHEN** un docente o administrador abre el detalle editable de una revisión existente
- **THEN** el sistema SHALL mostrar su estado actual y permitir guardar en una misma acción el estado, la nota privada y la devolución pública

#### Scenario: Unauthorized evaluation update
- **WHEN** un usuario sin permiso de gestión académica intenta modificar la evaluación desde el detalle de una revisión
- **THEN** el sistema SHALL rechazar la operación sin modificar sus datos
