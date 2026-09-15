## Why

Actualmente un estudiante puede liberar una reserva incluso después de que el docente haya registrado una devolución, una nota privada o un veredicto. Esto puede desvincular o eliminar evidencia académica ya cargada, por lo que las revisiones evaluadas deben quedar protegidas frente a acciones del estudiante.

## What Changes

- Permitir que un estudiante cancele su propia reserva únicamente mientras el turno no contenga contenido docente.
- Considerar contenido docente a la devolución pública, la nota privada o un veredicto registrado.
- Ocultar o deshabilitar la acción de liberación para estudiantes cuando la revisión ya esté protegida.
- Rechazar también desde el servidor y las reglas de PocketBase cualquier intento directo de liberar una revisión protegida.
- Mantener sin cambios las facultades de docentes y administradores para liberar o eliminar turnos.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `review-scheduling-and-evaluation`: restringir la cancelación estudiantil de reservas cuando exista contenido docente y reflejar el estado protegido en la lista de turnos.

## Impact

Afecta la interfaz de turnos de revisión, las acciones de servidor que cancelan reservas, las reglas de actualización de la colección `reviews` en PocketBase y sus pruebas. No modifica el máximo de dos reservas por sprint, los datos académicos existentes ni las facultades de docentes y administradores.
