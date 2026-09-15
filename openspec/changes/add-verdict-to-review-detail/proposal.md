## Why

Los docentes registran la retroalimentación y las notas de una revisión desde su detalle, pero para asignar el veredicto deben guardar, abandonar esa pantalla y completar la evaluación desde otro listado. Incorporar el veredicto al mismo formulario elimina ese paso duplicado y permite cerrar la evaluación en una sola operación.

## What Changes

- Mostrar el veredicto actual en el formulario editable del detalle de una revisión.
- Permitir que docentes y administradores seleccionen `Pendiente`, `Aprobado`, `No presentó` o `Desaprobado` junto con las notas de la revisión.
- Guardar el veredicto, la devolución pública, la nota privada y los datos de ubicación mediante una única acción del formulario.
- Mantener la autorización vigente para que solamente usuarios con permiso de gestión académica puedan modificar la evaluación.
- Fuera de alcance: no se modifican los valores admitidos, el esquema de PocketBase, el flujo de reserva de turnos ni el formulario alternativo del listado de estudiantes.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `review-scheduling-and-evaluation`: la evaluación de una revisión existente podrá completarse, incluido su veredicto, directamente desde la pantalla de detalle.

## Impact

- Formulario cliente `components/reviews/ReviewNotesForm.tsx`.
- Acción de servidor `updateReviewNotes` en `lib/actions-reviews.ts`.
- Pruebas del flujo de actualización de revisiones y evaluación.
- No se requieren nuevas dependencias ni migraciones de datos.
