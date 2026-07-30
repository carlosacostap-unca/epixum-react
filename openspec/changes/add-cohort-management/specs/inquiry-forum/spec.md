## MODIFIED Requirements

### Requirement: Authenticated inquiry visibility
El sistema SHALL permitir que un usuario autenticado liste y vea consultas y respuestas únicamente cuando tiene acceso a la cohorte de la consulta, salvo administradores globales.

#### Scenario: Inquiry list
- **WHEN** un usuario abre `/inquiries` con una cohorte activa
- **THEN** el sistema SHALL mostrar las consultas más recientes de esa cohorte con autor y contexto expandido

#### Scenario: Inquiry from another cohort
- **WHEN** un usuario no administrador intenta abrir una consulta de otra cohorte por identificador
- **THEN** el sistema SHALL denegar el acceso sin mostrar título, descripción ni respuestas

### Requirement: Inquiry search
El sistema SHALL buscar consultas exclusivamente dentro de la cohorte activa por título, descripción, autor, clase, trabajo práctico, sprint y contenido de respuestas.

#### Scenario: Debounced search
- **WHEN** el usuario deja de escribir durante 500 milisegundos
- **THEN** el sistema SHALL actualizar el parámetro `search` de la URL y ejecutar la búsqueda de servidor dentro de la cohorte activa

#### Scenario: Matching response
- **WHEN** el texto aparece en una respuesta de la cohorte activa
- **THEN** el sistema SHALL incluir la consulta asociada entre los resultados, dentro de los límites de búsqueda configurados

#### Scenario: Match exists in another cohort
- **WHEN** el texto coincide únicamente con consultas o respuestas de otra cohorte
- **THEN** el sistema SHALL devolver cero coincidencias

### Requirement: Inquiry creation
El sistema SHALL permitir a un integrante activo crear una consulta asociada obligatoriamente a su cohorte activa, con título, descripción y contexto opcional de clase o trabajo práctico de esa misma cohorte.

#### Scenario: Contextual creation
- **WHEN** la creación se inicia desde una clase o trabajo práctico de la cohorte activa
- **THEN** el formulario SHALL preseleccionar ese contexto y la consulta SHALL aparecer en su detalle

#### Scenario: Initial status
- **WHEN** se crea una consulta
- **THEN** el sistema SHALL asignar el estado `Pendiente`, el autor actual y la cohorte activa

#### Scenario: Cross-cohort context
- **WHEN** se intenta asociar una clase o trabajo práctico de otra cohorte
- **THEN** el sistema SHALL rechazar la creación
