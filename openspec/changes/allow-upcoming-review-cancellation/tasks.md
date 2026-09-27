## 1. Política de cancelación

- [x] 1.1 Extender la política compartida para exigir que `startTime` sea válido y futuro, con reloj inyectable; verificar casos futuro, instante de inicio, pasado, fecha inválida y reserva protegida mediante pruebas unitarias.

## 2. Servidor e interfaz estudiantil

- [x] 2.1 Rechazar en la acción de servidor las cancelaciones estudiantiles de turnos iniciados o pasados, mantener la liberación de `student` y `bookingOrdinal` en turnos elegibles y verificar el comportamiento con pruebas relevantes.
- [x] 2.2 Mostrar `Cancelar Reserva` sólo para reservas futuras no protegidas y presentar un motivo claro para las demás; verificar el renderizado mediante lint, tipos y build.

## 3. Autoridad de PocketBase

- [x] 3.1 Exigir que el inicio sea futuro en la regla final de actualización estudiantil, agregar una migración reversible que cambie sólo la regla y verificar su forma con pruebas de esquema y migración.
- [x] 3.2 Ampliar la matriz local de permisos para demostrar que un alumno puede liberar una reserva futura elegible, no una iniciada o pasada, y que otro alumno puede reservar el cupo liberado.

## 4. Verificación integral

- [x] 4.1 Ejecutar las pruebas académicas y de herramientas PocketBase, lint, build y `openspec validate --strict`; verificar que todas finalicen correctamente o documentar cualquier limitación ambiental.
