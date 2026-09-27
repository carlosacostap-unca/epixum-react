## Context

La elegibilidad de cancelación se calcula hoy a partir de `studentCancellationLocked`, mientras que `startTime` ya existe en cada revisión y la liberación vacía `student` y `bookingOrdinal`. La aplicación aplica permisos en la interfaz y en una server action, y PocketBase conserva la autoridad final mediante su regla `reviews.updateRule`. Véanse `proposal.md` y la especificación delta para el comportamiento esperado.

## Goals / Non-Goals

**Goals:**

- Centralizar una política temporal determinista y reutilizable por interfaz, servidor y pruebas.
- Mantener una validación autoritativa en servidor y en la regla de PocketBase frente a invocaciones directas.
- Liberar el mismo registro de turno, sin eliminarlo ni recrearlo, para conservar su identidad y devolverlo a la lista disponible.

**Non-Goals:**

- Agregar una ventana mínima de anticipación previa al inicio.
- Cambiar las reglas de cancelación para docentes o administradores.
- Cambiar el máximo de dos reservas o introducir historial de cancelaciones.

## Decisions

### Comparar contra el inicio estricto del turno

Una reserva será cancelable sólo cuando `startTime` sea estrictamente posterior al instante evaluado. En el instante exacto de inicio ya no será cancelable. La función de dominio recibirá un reloj opcional para que las pruebas no dependan de la hora real; un `startTime` inválido se tratará de forma conservadora como no cancelable.

Se descartó comparar contra `endTime`, porque permitiría liberar un turno mientras está ocurriendo, y usar solamente el estado de evaluación, porque no representa el límite temporal solicitado.

### Aplicar defensa en profundidad

La interfaz decidirá si muestra la acción usando la política compartida y la server action volverá a evaluar la hora con datos recién leídos. La rama de liberación estudiantil de la regla de actualización de PocketBase exigirá `startTime > @now`, además de las restricciones actuales de propiedad y protección.

Se descartó confiar sólo en el cliente por la posibilidad de llamadas directas, y confiar sólo en PocketBase porque la server action debe devolver un mensaje de negocio claro.

### Conservar el turno al cancelar

La cancelación continuará vaciando `student` y `bookingOrdinal`; no borrará el registro. Esto hace que la misma consulta de turnos disponibles lo ofrezca a otro alumno y evita una migración de datos.

## Risks / Trade-offs

- [El reloj del navegador puede diferir del servidor y mostrar brevemente un botón que ya venció] → La server action y PocketBase rechazarán la operación; al refrescar, la interfaz mostrará el estado actualizado.
- [La sintaxis temporal de PocketBase podría variar entre versiones] → Cubrir la regla generada con pruebas de esquema y la conducta real con la matriz local de permisos.
- [Una fecha inválida podría abrir una cancelación indebida] → La política falla de forma cerrada y no permite cancelar.

## Migration Plan

1. Actualizar y probar la política compartida y la experiencia del estudiante.
2. Incorporar la restricción temporal a la definición final y a una migración de reglas de PocketBase sin modificar registros.
3. Ejecutar pruebas unitarias, de esquema, permisos locales, lint y build.

El rollback restaura únicamente la regla anterior de actualización; no requiere revertir datos porque la migración no los modifica.
