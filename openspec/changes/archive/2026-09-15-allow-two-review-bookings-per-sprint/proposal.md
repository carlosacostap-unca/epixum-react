## Why

El límite actual de una reserva por estudiante y sprint impide que un alumno solicite una segunda instancia de revisión o seguimiento. Permitir hasta dos turnos distintos aporta esa flexibilidad sin alterar ni perder las reservas que ya existen.

## What Changes

- Permitir que cada estudiante reserve hasta dos turnos diferentes dentro del mismo sprint.
- Rechazar una tercera reserva tanto en la interfaz como en la acción de servidor.
- Seguir mostrando turnos disponibles cuando el estudiante tenga cero o una reserva, y mostrar claramente sus reservas actuales.
- Permitir cancelar de manera independiente cualquiera de los dos turnos reservados.
- Cuando existan dos revisiones con veredictos distintos, usar el veredicto de la revisión más reciente como estado general del sprint.
- Sustituir la restricción única de base de datos incompatible con el nuevo límite por una migración conservadora que no elimine, recree ni modifique registros de revisión existentes.
- Fuera de alcance: no se amplía el límite más allá de dos, no se cambian los valores posibles del veredicto y no se reasignan turnos existentes.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `review-scheduling-and-evaluation`: cambia el máximo de reservas por estudiante y sprint, la presentación de turnos para estudiantes con reservas y la resolución del estado general cuando hay más de una revisión.

## Impact

- Acción de reserva en `lib/actions-reviews.ts`.
- Presentación y controles en `components/reviews/ReviewsManager.tsx` y resumen de revisiones por sprint.
- Índice de la colección `reviews`, definición de esquema PocketBase y nueva migración reversible.
- Pruebas de límite, concurrencia razonable, cancelación, visualización y preservación de datos.
- No se requieren dependencias nuevas.
