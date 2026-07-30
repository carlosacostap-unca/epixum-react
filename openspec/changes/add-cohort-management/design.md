## Context

La aplicación resuelve hoy autorización por un rol global y consulta colecciones académicas sin una frontera superior al sprint. PocketBase es simultáneamente almacén, proveedor OAuth y autoridad final de acceso; no hay infraestructura de migraciones versionadas ni pruebas automatizadas de reglas. Ver `proposal.md` para la motivación y `specs/` para los contratos de comportamiento.

La introducción de cohortes atraviesa todas las rutas académicas, las claves de caché, las reglas PocketBase y los vínculos existentes. Debe desplegarse sin dejar temporalmente sprints huérfanos ni volver inaccesible la cohorte actual.

## Goals / Non-Goals

**Goals:**

- Establecer una frontera de datos explícita y verificable por cohorte.
- Mantener roles globales para identidad/plataforma y agregar participación contextual sin duplicar usuarios.
- Hacer que cada consulta y mutación académica reciba o derive una cohorte autorizada.
- Migrar el conjunto existente de forma idempotente y comprobable.
- Permitir despliegue gradual con compatibilidad para enlaces actuales.
- Corregir las reglas inseguras o inconsistentes de `reviews` al introducir el nuevo límite.

**Non-Goals:**

- Crear una biblioteca de plantillas o clonar contenido entre cohortes.
- Compartir un sprint, entrega, revisión o consulta entre cohortes.
- Incorporar organizaciones, sedes o aislamiento multi-tenant adicional.
- Incorporar equipos y mensajes al contexto de cohorte.
- Reemplazar PocketBase, Google OAuth o el patrón actual de server actions.

## Decisions

### 1. Modelo relacional normalizado con cohorte en el sprint

Se agregarán:

- `courses`: `name`, `description`, `status` (`active`, `archived`).
- `cohorts`: `course`, `name`, `startDate`, `endDate`, `status` (`planned`, `active`, `archived`).
- `enrollments`: `cohort`, `user`, `role` (`student`, `teacher`), `status` (`active`, `inactive`) e índice único `(cohort, user)`.
- `sprints.cohort`: relación simple y obligatoria.
- `inquiries.cohort`: relación simple y obligatoria.

Clases, trabajos, enlaces, entregas y revisiones derivarán su cohorte a través del sprint. `inquiries` tendrá una relación directa porque puede existir sin clase ni trabajo y porque esa relación simplifica búsquedas y reglas.

Se descarta agregar `cohort` a todas las colecciones: duplicaría información y permitiría relaciones contradictorias. También se descarta relacionar sprints directamente con `course`, porque la cohorte ya determina el curso.

### 2. Rol global más rol de inscripción

`users.role` seguirá expresando el máximo privilegio global (`admin`, `docente`, `estudiante`). `enrollments.role` expresará la función dentro de una cohorte (`teacher`, `student`). Un administrador global tendrá acceso a todas las cohortes sin inscripción; cualquier otro usuario necesitará una inscripción activa y compatible.

Una inscripción nunca elevará a un estudiante global a docente. Solo administradores gestionarán inscripciones docentes; un docente inscrito podrá gestionar estudiantes de su cohorte.

Se descarta reemplazar el rol global por inscripciones: rompería la administración de plataforma y complicaría el primer acceso y las reglas actuales.

### 3. Cohorte explícita en URL con preferencia recordada

Las rutas de listado académico usarán el prefijo `/cohorts/[cohortId]`, por ejemplo:

- `/cohorts/[cohortId]/sprints`
- `/cohorts/[cohortId]/reviews`
- `/cohorts/[cohortId]/students`
- `/cohorts/[cohortId]/inquiries`

El selector navegará a la ruta equivalente de la nueva cohorte y guardará `active_cohort` como preferencia no autoritativa. `/sprints`, `/reviews`, `/students` e `/inquiries` redirigirán a la cohorte válida recordada o a la primera accesible durante la transición. Los detalles con identificador conservarán inicialmente sus rutas actuales, derivarán la cohorte del registro y redirigirán al contexto canónico cuando corresponda.

Se prefiere la URL explícita frente a depender solo de una cookie porque permite enlaces reproducibles, evita ambigüedad entre pestañas y facilita claves de caché. La cookie sirve únicamente para elegir el destino predeterminado.

### 4. Resolución central de contexto y autorización

Un helper de servidor resolverá `{ user, cohort, enrollment, permissions }` a partir de la sesión y `cohortId`. Toda página y server action académica lo invocará antes de acceder a PocketBase. Los identificadores recibidos por una mutación se volverán a consultar para comprobar que su cadena de relaciones pertenece a la cohorte resuelta; no se confiará en identificadores ocultos de formularios.

Las reglas PocketBase repetirán la frontera mediante relaciones:

- acceso de miembro: inscripción activa del usuario para la cohorte derivada;
- acceso docente: inscripción activa con rol docente más rol global compatible;
- acceso administrador: `@request.auth.role = "admin"`;
- propiedad estudiantil: miembro activo y propietario del registro.

Se descarta confiar únicamente en server actions porque PocketBase es accesible directamente desde el navegador.

### 5. Reglas de reviews endurecidas y reserva atómica

La migración de reglas de `reviews` eliminará la actualización abierta a cualquier autenticado y alineará create/update/delete con docente de cohorte o administrador. Los estudiantes solo podrán asignarse o desasignarse a sí mismos en un turno de su cohorte y no podrán modificar notas, estado, docente, sprint, horarios ni ubicación.

La lectura estudiantil excluirá `private_note`. Si PocketBase no permite ocultar campos con reglas de colección, se separarán las notas privadas en una colección `review_private_notes` accesible solo a docentes/administradores; esta separación es la opción preferida porque aplica privacidad en la fuente y no solo en la interfaz.

Se agregará un índice único parcial para `(sprint, student)` cuando `student` no esté vacío, evitando reservas dobles por concurrencia. Los turnos libres pueden compartir sprint porque el valor de estudiante está vacío.

### 6. Caché segmentada por cohorte

Toda función cacheada recibirá `cohortId` como argumento y sus claves/tags incluirán ese identificador, por ejemplo `cohort:{id}:sprints`, `cohort:{id}:students` y `cohort:{id}:reviews`. Las mutaciones invalidarán tags de la cohorte afectada.

Se descarta filtrar en memoria un resultado global cacheado: ampliaría el impacto de una fuga y permitiría devolver accidentalmente datos de otra cohorte.

### 7. Interfaces administrativas separadas

Se crearán vistas para:

- administrar cursos (solo admin);
- listar y editar cohortes;
- administrar participantes de una cohorte;
- seleccionar cohorte desde el encabezado.

`/admin/users` seguirá administrando identidad y rol global. `/cohorts/[cohortId]/students` administrará participación y evaluaciones contextuales. Esta separación evita confundir elevar un rol global con inscribir a alguien en una edición.

### 8. Migración aditiva, idempotente y verificada

La migración será un script versionado y repetible con fases:

1. Preflight y backup: autenticar como superusuario, inventariar conteos, relaciones y reglas, y abortar ante datos inválidos.
2. Crear o actualizar `courses`, `cohorts`, `enrollments` y los campos de relación inicialmente opcionales.
3. Crear/reutilizar el curso `React` y la cohorte `Cohorte inicial`. Sus fechas se derivarán del mínimo inicio y máximo fin de los sprints; si faltan, se usarán las marcas de creación extremas.
4. Inscribir usuarios globales `estudiante` y `docente` según su rol actual; los administradores no requieren inscripción.
5. Asociar todos los sprints existentes a la cohorte inicial y todas las consultas mediante su clase/trabajo o, si no tienen contexto, directamente a la cohorte inicial.
6. Verificar conteos, ausencia de registros sin cohorte y consistencia de relaciones.
7. Volver obligatorios los campos, crear índices y aplicar las reglas definitivas.

Cada registro creado por la migración tendrá una clave natural determinista para poder reanudarla. El script no eliminará datos.

## Risks / Trade-offs

- **[Reglas PocketBase con relaciones profundas pueden ser difíciles de verificar]** → crear una matriz automatizada de permisos por rol, inscripción, propiedad y cohorte contra una instancia de prueba.
- **[Una migración remota puede quedar a mitad de camino]** → usar fases idempotentes, preflight, verificación posterior y campos opcionales hasta completar el backfill.
- **[Las URLs nuevas pueden romper marcadores]** → mantener redirecciones desde las rutas actuales y canonicalizar después de resolver la cohorte.
- **[La cookie de cohorte puede quedar obsoleta]** → tratarla como preferencia, validar siempre inscripción/estado y nunca usarla como prueba de autorización.
- **[Separar notas privadas agrega una consulta y colección]** → aceptar el costo para garantizar privacidad en PocketBase; expandir o consultar en paralelo solo para docentes.
- **[Archivar una cohorte puede bloquear correcciones históricas]** → permitir reactivación explícita a administradores en vez de excepciones de escritura implícitas.
- **[No hay clonación de contenido]** → la primera versión requiere crear sprints y contenidos de la nueva cohorte manualmente; una capacidad de plantillas puede añadirse después sin alterar el aislamiento.

## Migration Plan

1. Añadir script de snapshot/preflight y pruebas de reglas sobre un entorno de prueba.
2. Desplegar colecciones y relaciones opcionales, ejecutar backfill y verificar conteos.
3. Desplegar tipos, resolución de contexto, rutas compatibles y lecturas filtradas.
4. Desplegar administración de cursos, cohortes e inscripciones.
5. Activar campos obligatorios, índices y reglas definitivas; ejecutar nuevamente la matriz de autorización.
6. Habilitar el selector y las nuevas rutas canónicas.
7. Monitorear errores 403/404, reservas y conteos por cohorte antes de crear la segunda cohorte.

Rollback: deshabilitar selector y rutas nuevas, restaurar las reglas anteriores solo durante una ventana controlada y mantener las nuevas relaciones/colecciones sin borrar datos. Si la integridad o privacidad falla, restaurar PocketBase desde el backup de preflight; nunca intentar rollback eliminando en masa los registros migrados.
