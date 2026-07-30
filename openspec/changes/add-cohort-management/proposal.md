## Why

La aplicación modela hoy una única edición implícita del Curso de React: todos los sprints, estudiantes, entregas, revisiones y consultas comparten el mismo espacio. Incorporar cohortes permite operar nuevas ediciones del mismo curso sin mezclar participantes ni actividad académica y preservando los datos actuales.

## What Changes

- Incorporar cursos reutilizables y cohortes concretas con nombre, período y estado.
- Incorporar inscripciones que relacionen estudiantes, docentes y administradores con cada cohorte.
- Permitir a docentes y administradores crear, editar, activar, archivar y seleccionar cohortes.
- Asociar cada sprint a una cohorte y resolver clases, trabajos prácticos, entregas y revisiones mediante esa pertenencia.
- Limitar listados, navegación y operaciones académicas a la cohorte seleccionada y a las inscripciones autorizadas.
- Permitir administrar integrantes y roles de participación dentro de una cohorte sin reemplazar el rol global de plataforma.
- Migrar todos los datos académicos actuales a un curso “React” y una cohorte inicial, sin perder relaciones ni historial.
- Mantener una cohorte activa en la sesión/navegación y ofrecer un selector cuando el usuario tenga acceso a más de una.
- Aislar las consultas por cohorte, incluyendo las creadas desde clases o trabajos prácticos.
- No se incorporarán plantillas, clonación automática de contenido entre cohortes, equipos/chat por cohorte ni soporte multiinstitución en este cambio.

## Capabilities

### New Capabilities

- `course-and-cohort-management`: definición de cursos, ciclo de vida de cohortes, selección de cohorte activa y migración de la edición existente.
- `cohort-enrollment`: inscripción de usuarios, roles dentro de la cohorte y autorización de acceso a sus datos.

### Modified Capabilities

- `authentication-and-access`: la navegación autenticada deberá resolver una cohorte activa entre las cohortes accesibles.
- `user-and-profile-management`: el directorio de estudiantes y la administración de participantes pasarán a tener alcance de cohorte.
- `academic-content`: cada sprint pertenecerá obligatoriamente a una cohorte y sus listados y mutaciones se limitarán a ella.
- `assignment-deliveries`: las entregas serán accesibles únicamente dentro de la cohorte del trabajo práctico y por integrantes autorizados.
- `review-scheduling-and-evaluation`: turnos y evaluaciones serán visibles y administrables solo dentro de la cohorte correspondiente.
- `inquiry-forum`: consultas, búsquedas y respuestas se aislarán por cohorte.
- `platform-foundations`: el modelo PocketBase, las consultas cacheadas y la revalidación incorporarán curso, cohorte e inscripción.

## Impact

- Nuevas colecciones PocketBase `courses`, `cohorts` y `enrollments`, con índices y reglas API.
- Nueva relación obligatoria `cohort` en `sprints` y `inquiries`; migración transaccional o idempotente de registros existentes.
- Cambios en tipos TypeScript, acceso a datos, server actions, proxy/contexto de navegación y claves de caché.
- Nuevas pantallas de administración y selector global de cohorte; actualización de páginas de sprints, estudiantes, revisiones y consultas.
- Revisión integral de reglas PocketBase para evitar acceso cruzado entre cohortes y corregir la deriva de permisos ya detectada en `reviews`.
- Pruebas de migración, autorización entre cohortes, selección de contexto y regresión de los flujos académicos existentes.
