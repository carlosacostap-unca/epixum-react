# PocketBase MCP Administration Specification

## Purpose

Define el servidor MCP local que permite inspeccionar y administrar PocketBase mediante herramientas estructuradas.

## Requirements

### Requirement: Environment-based configuration
El servidor MCP SHALL obtener URL y credenciales de superusuario desde `NEXT_PUBLIC_POCKETBASE_URL`, `POCKETBASE_ADMIN_EMAIL` y `POCKETBASE_ADMIN_PASSWORD`.

#### Scenario: Missing configuration
- **WHEN** falta cualquiera de las variables requeridas
- **THEN** el proceso SHALL finalizar con un error que identifique la variable sin imprimir secretos

### Requirement: Stdio MCP transport
El servidor SHALL comunicarse mediante MCP sobre `stdio` para que un cliente local pueda iniciarlo como subproceso.

#### Scenario: MCP client connects
- **WHEN** un cliente inicia el comando configurado en `.mcp.json`
- **THEN** el servidor SHALL completar el handshake y anunciar sus herramientas

### Requirement: Lazy superuser authentication
El servidor SHALL autenticar contra `_superusers` al ejecutar una herramienta y SHALL reutilizar una sesión válida sin exponer el token.

#### Scenario: Health check
- **WHEN** se invoca `pocketbase_health`
- **THEN** el servidor SHALL informar conectividad, autenticación y modo de lectura sin devolver credenciales

### Requirement: Schema inspection tools
El servidor SHALL ofrecer herramientas para listar colecciones y recuperar una colección por nombre o identificador.

#### Scenario: List collections
- **WHEN** se invoca `pocketbase_list_collections`
- **THEN** el servidor SHALL devolver esquemas, reglas, índices y tipos disponibles

### Requirement: Record reading tools
El servidor SHALL permitir listar registros paginados y recuperar un registro individual, con opciones de filtro, orden, expansión y selección de campos.

#### Scenario: Paginated query
- **WHEN** el cliente solicita una colección con página y tamaño válido de hasta 200
- **THEN** el servidor SHALL devolver el resultado paginado de PocketBase

### Requirement: Safe default write policy
El servidor SHALL bloquear crear, actualizar y eliminar registros salvo que `POCKETBASE_MCP_READ_ONLY=false` esté configurado explícitamente.

#### Scenario: Write attempted in default mode
- **WHEN** se invoca una herramienta de escritura en modo de solo lectura
- **THEN** el servidor SHALL rechazarla sin contactar el endpoint de mutación

#### Scenario: Explicitly enabled write
- **WHEN** el modo de escritura está habilitado y los datos son válidos
- **THEN** el servidor SHALL ejecutar la creación, actualización o eliminación solicitada

### Requirement: MCP tool annotations
El servidor SHALL anotar las herramientas según sean de lectura, escritura, idempotentes o destructivas.

#### Scenario: Tool discovery
- **WHEN** un cliente enumera herramientas
- **THEN** el cliente SHALL recibir ocho herramientas con sus esquemas y sugerencias de seguridad

### Requirement: Sanitized errors
El servidor SHALL transformar errores de PocketBase en resultados MCP legibles con mensaje, estado y detalles de validación, sin incluir contraseñas ni tokens.

#### Scenario: PocketBase request fails
- **WHEN** una operación devuelve un error HTTP o de validación
- **THEN** la herramienta SHALL responder con `isError = true` y datos sanitizados

### Requirement: End-to-end smoke test
El proyecto SHALL incluir una prueba que inicie el servidor, enumere herramientas y ejecute la comprobación autenticada de salud.

#### Scenario: Working configuration
- **WHEN** se ejecuta `npm run mcp:pocketbase:test` con acceso de red y credenciales válidas
- **THEN** la prueba SHALL confirmar ocho herramientas y autenticación correcta
