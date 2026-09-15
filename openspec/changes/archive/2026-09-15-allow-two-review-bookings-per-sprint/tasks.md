## 1. Esquema y migración conservadora

- [x] 1.1 Agregar `bookingOrdinal` al tipo `Review` y a la definición esperada de `reviews`, reemplazando el índice de una reserva por el índice de dos posiciones; verificar con las pruebas de esquema que el campo y el nuevo índice sean exactos.
- [x] 1.2 Crear una migración ascendente que agregue el campo y sustituya el índice sin actualizar ni eliminar registros, y una reversión que aborte si existen reservas dobles; verificar estáticamente que la migración no contiene mutaciones de registros.
- [x] 1.3 Ejecutar la migración sobre una base local con turnos disponibles y reservados, comparando antes y después cantidad, IDs y campos académicos; verificar además que admite `first` y `second` pero rechaza una tercera posición equivalente.

## 2. Límite de reservas en servidor

- [x] 2.1 Implementar una utilidad pura que normalice reservas históricas, calcule la posición libre y seleccione la revisión más reciente; verificar con pruebas unitarias los casos de cero, una, dos reservas y desempates.
- [x] 2.2 Actualizar `bookReviewSlot` para asignar una de las dos posiciones, rechazar la tercera reserva y reintentar una vez ante colisión concurrente; verificar los mensajes y que un turno ocupado nunca se reasigne.
- [x] 2.3 Actualizar `cancelReviewBooking` para limpiar también `bookingOrdinal`; verificar que cancelar una de dos reservas conserva la otra y vuelve a liberar una posición.

## 3. Interfaz y estado general

- [x] 3.1 Reemplazar la reserva singular de `ReviewsManager` por una colección de reservas propias y mostrar reservas más turnos disponibles mientras el estudiante tenga menos de dos; verificar manualmente los estados de cero y una reserva.
- [x] 3.2 Al alcanzar dos reservas, mostrar ambas con sus acciones de detalle y cancelación y ocultar la posibilidad de una tercera; verificarlo en una prueba de interfaz.
- [x] 3.3 Resolver el estado general del sprint con la revisión de mayor `startTime`, usando los desempates definidos; verificar con una prueba que dos veredictos distintos muestran el de la revisión más reciente.

## 4. Verificación integral

- [x] 4.1 Ampliar el recorrido E2E para reservar dos turnos distintos, rechazar un tercero, cancelar uno y volver a reservar; verificar que los demás estudiantes y turnos ocupados mantienen sus reglas actuales.
- [x] 4.2 Ejecutar pruebas unitarias, pruebas de esquema y permisos, E2E, lint y build; documentar el snapshot de preservación y cualquier comprobación manual pendiente.
