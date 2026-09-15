## Context

El detalle de una revisión carga un registro `Review` y entrega su edición a `ReviewNotesForm`. El componente conserva estado local para ubicación, nota privada y devolución pública, y llama a `updateReviewNotes`; esa acción actualiza los campos públicos del registro `reviews` y persiste la nota privada por separado en `review_private_notes`.

El campo `reviews.status` ya existe, está tipado y acepta `Pendiente`, `Aprobado`, `No presentó` y `Desaprobado`. Otro formulario de la aplicación ya utiliza esos mismos valores. Véanse `proposal.md` y la especificación delta para el comportamiento requerido.

## Goals / Non-Goals

**Goals:**

- Integrar el estado actual de evaluación al estado controlado de `ReviewNotesForm`.
- Guardar el estado mediante la misma acción de servidor que procesa los demás datos del formulario.
- Conservar la autorización en servidor y rechazar valores fuera del conjunto permitido.
- Refrescar las vistas que muestran el estado para que el nuevo veredicto sea visible inmediatamente.

**Non-Goals:**

- Unificar o rediseñar los distintos formularios de evaluación existentes.
- Cambiar la separación de privacidad entre `reviews` y `review_private_notes`.
- Introducir transacciones, migraciones o nuevos estados de evaluación.

## Decisions

### Mantener el veredicto dentro de `ReviewNotesForm`

El componente inicializará el veredicto con el valor del registro o `Pendiente` cuando no esté definido, y presentará las cuatro opciones admitidas dentro del mismo formulario. Esto conserva una única interacción de guardado y reutiliza el lenguaje visual del selector existente en el listado de estudiantes.

Se descartó crear un segundo formulario o un guardado inmediato al seleccionar una opción porque cualquiera de esas alternativas volvería a separar el veredicto de las notas o permitiría persistencias involuntarias antes de confirmar los cambios.

### Extender `updateReviewNotes` en lugar de reutilizar `upsertReviewNotes`

`updateReviewNotes` seguirá siendo la acción específica del detalle y recibirá también el veredicto. La acción verificará que el valor pertenezca al conjunto admitido y lo incluirá en la actualización de `reviews` junto con `public_note`, `meetingLink` y `roomNumber`; la nota privada conservará su almacenamiento protegido actual.

Se descartó llamar a `upsertReviewNotes` porque esa acción requiere sprint y estudiante, contempla crear evaluaciones sin turno y no actualiza los datos de ubicación. Reutilizarla ampliaría innecesariamente el contrato y mezclaría dos casos de uso distintos.

### Conservar la autorización y ampliar la revalidación

La acción continuará resolviendo la revisión con permiso `manage-academics` antes de escribir. Después del guardado se revalidarán el contexto de revisiones, el listado del sprint y el detalle de la revisión, de modo que tanto el formulario como los indicadores de estado reflejen el resultado.

## Risks / Trade-offs

- [Deriva entre los selectores de estado existentes] → Usar el mismo tipo y el mismo conjunto explícito de valores admitidos, y cubrir las cuatro opciones con pruebas.
- [Invocación manipulada de la acción con un valor no admitido] → Validar el veredicto en el servidor antes de actualizar PocketBase.
- [Actualización parcial si falla la escritura de la nota privada] → Mantener el manejo de error y la recarga desde servidor; la separación entre datos públicos y privados se conserva por su finalidad de acceso y queda fuera del alcance transaccional de este cambio.
- [Confusión entre `Pendiente` real y ausencia de valor heredada] → Mostrar `Pendiente` como valor inicial y persistirlo explícitamente al guardar.

## Migration Plan

1. Desplegar el formulario y la acción de servidor en la misma versión.
2. Verificar una revisión con cada veredicto y confirmar su reflejo en el detalle y en el listado.
3. Ante una regresión, revertir ambos cambios de aplicación; no se requiere revertir esquema ni datos porque el campo y sus valores ya existen.
