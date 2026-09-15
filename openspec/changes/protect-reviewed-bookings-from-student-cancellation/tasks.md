## 1. Modelo y política de protección

- [x] 1.1 Agregar `studentCancellationLocked` al tipo de revisión y una función pura que derive el bloqueo desde devolución, nota privada y veredicto; verificar sus casos límite con pruebas unitarias.
- [x] 1.2 Incorporar el campo y el backfill preservador al esquema/migración de PocketBase; verificar que detecte registros históricos evaluados sin modificar sus datos académicos.

## 2. Autorización y acciones de servidor

- [x] 2.1 Restringir la regla de actualización estudiantil para permitir liberar solo revisiones desbloqueadas y proteger el campo de bloqueo; verificar las expresiones con pruebas del esquema.
- [x] 2.2 Ajustar las reglas de notas privadas para exigir una revisión protegida al crear contenido y verificar que docentes y administradores conserven sus permisos.
- [x] 2.3 Actualizar las acciones de evaluación para mantener el indicador y la cancelación para comprobar también la nota privada; verificar cancelaciones permitidas y rechazadas mediante pruebas automatizadas.

## 3. Experiencia del estudiante

- [x] 3.1 Ocultar la acción de cancelación en reservas protegidas y mostrar una indicación clara sin revelar el motivo privado; verificar el renderizado para reservas desbloqueadas y protegidas.

## 4. Verificación integral

- [x] 4.1 Actualizar la matriz de permisos para cubrir cancelación directa desbloqueada y rechazos por devolución, nota privada y veredicto; ejecutar la suite local de PocketBase.
- [x] 4.2 Ejecutar lint, pruebas relevantes y build de producción, y validar el cambio OpenSpec en modo estricto.
