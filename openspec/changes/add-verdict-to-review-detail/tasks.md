## 1. Contrato y persistencia del veredicto

- [ ] 1.1 Extender `updateReviewNotes` para recibir un veredicto tipado, validarlo contra `Pendiente`, `Aprobado`, `No presentó` y `Desaprobado`, e incluirlo en la actualización del registro `reviews`.
- [ ] 1.2 Mantener la comprobación `manage-academics` y revalidar tanto el listado del sprint como el detalle de la revisión después de guardar.
- [ ] 1.3 Agregar una prueba automatizada del conjunto de veredictos admitidos y del rechazo de valores manipulados antes de persistir.

## 2. Formulario del detalle de revisión

- [ ] 2.1 Incorporar al estado de `ReviewNotesForm` el veredicto actual, usando `Pendiente` como valor inicial cuando el registro no lo tenga definido.
- [ ] 2.2 Mostrar las cuatro opciones de veredicto dentro del formulario, con selección visible y controles deshabilitados mientras se guarda.
- [ ] 2.3 Enviar el veredicto junto con ubicación, nota privada y devolución pública mediante el único botón de guardado existente, conservando los mensajes de éxito y error.

## 3. Verificación integral

- [ ] 3.1 Agregar o ampliar una prueba de interfaz que abra una revisión como docente, cambie el veredicto junto con las notas y confirme que el valor guardado vuelve a mostrarse en el detalle y en el listado.
- [ ] 3.2 Verificar que un usuario sin permiso de gestión académica no pueda modificar la evaluación y que el estudiante sólo vea la información pública correspondiente.
- [ ] 3.3 Ejecutar las pruebas afectadas, el análisis estático y la compilación de producción; registrar cualquier verificación manual necesaria para los cuatro estilos de veredicto.
