## Context

La colección `reviews` representa a la vez los turnos disponibles, las reservas y la evaluación. Actualmente un índice parcial único sobre `(sprint, student)` y una comprobación previa en `bookReviewSlot` limitan a una sola reserva. La interfaz también modela una única reserva mediante `find` y oculta los demás turnos en cuanto la encuentra.

El cambio debe admitir exactamente dos reservas, mantener la autoridad final en PocketBase y preservar sin reescritura todos los turnos ya otorgados. Véanse `proposal.md` y la especificación delta para el comportamiento observable.

## Goals / Non-Goals

**Goals:**

- Aplicar el máximo de dos incluso ante solicitudes concurrentes.
- Identificar de forma interna las dos posiciones de reserva sin alterar los datos académicos existentes.
- Mantener visibles las opciones necesarias para obtener una segunda reserva.
- Resolver de manera determinista el estado general del sprint a partir de la revisión con mayor `startTime`.
- Hacer que la migración ascendente sea puramente aditiva sobre registros y verificable mediante conteos antes y después.

**Non-Goals:**

- Fusionar notas o veredictos de dos revisiones.
- Modificar horarios, estudiantes, docentes o contenido de revisiones existentes.
- Permitir más de dos reservas o reservas repetidas sobre el mismo turno.

## Decisions

### Reemplazar el índice único por dos posiciones controladas

Se agregará a `reviews` un campo select opcional interno, `bookingOrdinal`, con valores `first` y `second`. El índice actual `idx_reviews_sprint_student` se reemplazará por un índice único parcial que use `(sprint, student, posición normalizada)`: `second` conserva ese valor y cualquier otro valor, incluido el vacío de los registros históricos, se normaliza como `first`.

Así, una reserva histórica continúa ocupando la primera posición sin actualizar su registro. La segunda utiliza `second`; PocketBase impide dos primeras o dos segundas reservas para el mismo estudiante y sprint. Se descartó retirar el índice y confiar sólo en un conteo de aplicación porque dos solicitudes concurrentes podrían superar el límite.

### Reservar con selección y reintento acotado de posición

La acción de servidor obtendrá las reservas actuales del estudiante en el sprint, normalizará los valores históricos vacíos como `first` y elegirá la primera posición libre. Si una escritura colisiona por concurrencia, volverá a consultar una vez: usará la otra posición si sigue disponible o devolverá el error de límite si ya existen dos reservas. La disponibilidad del turno se comprobará antes de cada intento y PocketBase seguirá resolviendo cualquier carrera por el propio registro.

Al cancelar una reserva se limpiarán `student` y `bookingOrdinal`. Esto libera exactamente una posición y no afecta la otra reserva.

### Modelar las reservas del estudiante como colección

`ReviewsManager` reemplazará la reserva singular por una lista de reservas propias y un conteo. Con cero o una reserva mostrará las reservas propias junto con turnos disponibles; con dos mostrará las dos reservas y dejará de ofrecer controles para reservar. Los turnos ocupados por otros estudiantes continuarán sin ser reservables.

Se descartó mantener la vista reducida después de la primera reserva porque impediría descubrir y elegir el segundo turno.

### Derivar el veredicto general de la revisión más reciente

Los resúmenes por sprint seleccionarán entre las revisiones del estudiante la de mayor `startTime` y usarán su estado, con `Pendiente` como valor por defecto. Cada detalle conserva sus propias notas y veredicto; no se copiarán valores entre turnos.

## Risks / Trade-offs

- [La migración podría eliminar reservas por error] → La operación ascendente sólo cambia esquema e índices; una prueba comparará cantidad e identidad de registros antes y después y no habrá llamadas de actualización o eliminación de registros.
- [Dos reservas concurrentes intentan ocupar la misma posición] → El índice único decide la colisión y la acción realiza un único reintento con la posición restante.
- [Un registro histórico tiene `bookingOrdinal` vacío] → El índice y la lógica lo normalizan como `first`, evitando cualquier backfill destructivo o innecesario.
- [El rollback encuentra estudiantes con dos reservas] → La reversión SHALL abortar antes de restaurar el índice antiguo; nunca eliminará ni liberará reservas para forzar el rollback.
- [Dos revisiones comparten el mismo `startTime`] → Usar `created` y finalmente `id` como desempate estable, sin modificar registros.

## Migration Plan

1. Ejecutar un preflight de sólo lectura que registre la cantidad e identificadores de `reviews` y confirme que el índice único actual existe.
2. Incorporar `bookingOrdinal`, crear el nuevo índice de dos posiciones y retirar el índice anterior dentro de la migración de esquema, sin mutar registros.
3. Verificar que la cantidad, identificadores y campos académicos de todas las revisiones coincidan con el snapshot previo.
4. Desplegar conjuntamente la acción de reserva y la interfaz preparada para dos turnos.
5. Para revertir, comprobar primero que ninguna combinación estudiante-sprint tenga más de una reserva. Si existe alguna, abortar la reversión conservando los datos; si no existe, restaurar el índice anterior y retirar el campo interno.
