## Why

La cancelación estudiantil actual no distingue si el turno todavía puede ocurrir, por lo que una reserva pasada sin evaluación puede liberarse y volver a aparecer como disponible. La disponibilidad debe representar turnos realmente solicitables y permitir que otro alumno aproveche un cupo futuro cancelado.

## What Changes

- Permitir que un estudiante cancele una reserva propia sólo antes del horario de inicio del turno y mientras no contenga contenido docente protegido.
- Liberar los campos de asignación al cancelar para que el turno futuro vuelva a estar disponible para otros alumnos.
- Rechazar desde el servidor las cancelaciones de turnos iniciados o pasados, aun cuando se invoque la acción directamente.
- Mostrar la acción de cancelación únicamente en reservas futuras elegibles y comunicar claramente por qué una reserva ya no puede cancelarse.
- Mantener sin cambios las facultades de docentes y administradores para liberar reservas.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `review-scheduling-and-evaluation`: incorporar el inicio del turno como límite temporal de la cancelación estudiantil y asegurar que una cancelación elegible restituya la disponibilidad del cupo.

## Impact

Afecta la política de cancelación compartida, la acción de servidor de reservas, la lista estudiantil de turnos y sus pruebas unitarias o de interfaz. No modifica el máximo de dos reservas por sprint, el contenido de evaluación, los datos existentes ni los permisos de docentes y administradores.
