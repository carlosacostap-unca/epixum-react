## Context

La reserva y la evaluación comparten el registro `reviews`, pero la nota privada se almacena en `review_private_notes` para que nunca sea legible por estudiantes. La interfaz actual decide si ofrece cancelar solo a partir de la propiedad de la reserva, mientras que la regla de actualización de PocketBase permite al propietario vaciar `student` y `bookingOrdinal` sin distinguir si existe contenido docente. Véanse `proposal.md` y la especificación delta para el comportamiento requerido.

## Goals / Non-Goals

**Goals:**

- Mantener una señal segura y visible para el estudiante que indique si su reserva puede cancelarse, sin exponer notas privadas.
- Aplicar la misma restricción en la interfaz, la acción de servidor y la regla de actualización de PocketBase.
- Preservar las reservas y evaluaciones existentes al introducir la protección.
- Mantener la reversibilidad del cambio de esquema mediante una migración que solo elimine el campo nuevo, sin tocar evaluaciones.

**Non-Goals:**

- Cambiar el máximo de dos reservas por estudiante y sprint.
- Restringir las acciones de liberación o eliminación de docentes y administradores.
- Considerar el enlace de reunión o la sala como contenido de evaluación.

## Decisions

### Persistir un indicador derivado de protección en `reviews`

Se agregará un booleano `studentCancellationLocked` a cada revisión. Será verdadero cuando exista devolución pública, una nota privada no vacía o un veredicto distinto de `Pendiente`. La interfaz podrá mostrar el bloqueo sin consultar ni revelar la colección privada, y la regla nativa de PocketBase podrá impedir que un estudiante eluda la acción de servidor.

Se descartó basar la interfaz solamente en `public_note` y `status`, porque una nota privada también debe proteger la reserva y no puede exponerse al cliente. También se descartó confiar únicamente en la acción de servidor, porque un cliente podría invocar PocketBase directamente.

### Mantener el indicador desde todas las escrituras docentes de la aplicación

Las acciones que guardan evaluación calcularán el indicador a partir de los valores finales de devolución, nota privada y veredicto. Al crear la primera nota privada, la revisión se bloqueará antes de escribir la nota. Al vaciar todo el contenido docente y dejar el veredicto en `Pendiente`, la revisión podrá volver a quedar desbloqueada.

La regla de `reviews` exigirá que los estudiantes no cambien el indicador y que el valor almacenado sea falso para cancelar. Las reglas docentes seguirán autorizando la gestión académica; la creación de notas privadas requerirá que la revisión ya esté bloqueada para evitar que una escritura directa deje contenido privado sin protección.

### Migrar por derivación, sin alterar datos académicos

La migración añadirá el campo y marcará como protegidas las revisiones existentes que ya tengan devolución pública, nota privada no vacía o veredicto distinto de `Pendiente`. No cambiará estudiantes, ordinales, notas, veredictos, horarios, cohortes ni inscripciones. La verificación comparará conteos y un resumen estable de los campos académicos antes y después.

## Risks / Trade-offs

- [Una falla entre el bloqueo de la revisión y la escritura de una nota privada puede dejar una reserva bloqueada sin contenido] → La acción recalculará y compensará el indicador ante errores cuando sea seguro; un bloqueo conservador evita pérdida de evaluación.
- [Escrituras docentes realizadas fuera de la aplicación podrían desincronizar el indicador] → Las reglas exigirán bloqueo para crear contenido privado y coherencia mínima al guardar devolución o veredicto; las pruebas de permisos cubrirán los intentos directos relevantes.
- [Registros históricos con `Pendiente` pueden representar un veredicto elegido explícitamente] → Se considera `Pendiente` el estado neutral y solo los otros veredictos bloquean por sí solos, de acuerdo con la regla confirmada por el usuario.

## Migration Plan

1. Ejecutar pruebas unitarias de detección de contenido, reglas y migración sobre PocketBase local.
2. Crear un respaldo y capturar conteos/resumen académico antes de producción.
3. Agregar y derivar `studentCancellationLocked` únicamente en `reviews`, sin crear cohortes ni otros registros.
4. Aplicar las reglas actualizadas y verificar que conteos y contenido académico permanezcan iguales.
5. Desplegar la aplicación y realizar una prueba controlada de cancelación permitida y bloqueada.

El rollback restaura las reglas anteriores y elimina únicamente `studentCancellationLocked`; no revierte ni elimina evaluaciones.
