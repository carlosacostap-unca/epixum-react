# PocketBase MCP

This repository includes a local MCP server that connects to PocketBase with the
credentials already stored in `.env.local`.

## Start it

```powershell
npm run mcp:pocketbase
```

To verify the MCP handshake and PocketBase authentication end to end:

```powershell
npm run mcp:pocketbase:test
```

MCP clients that support project-level `.mcp.json` can discover the included
configuration automatically. Otherwise, configure the client with:

```json
{
  "mcpServers": {
    "pocketbase": {
      "command": "npm.cmd",
      "args": ["run", "--silent", "mcp:pocketbase"],
      "cwd": "C:\\Proyectos\\epixum-react"
    }
  }
}
```

On macOS or Linux, replace `npm.cmd` with `npm`.

## Environment

Required variables (already present in `.env.local`):

- `NEXT_PUBLIC_POCKETBASE_URL`
- `POCKETBASE_ADMIN_EMAIL`
- `POCKETBASE_ADMIN_PASSWORD`

The server is read-only by default because it authenticates as a PocketBase
superuser. To enable create, update, and delete tools, add this explicit setting:

```dotenv
POCKETBASE_MCP_READ_ONLY=false
```

## Tools

- `pocketbase_health`
- `pocketbase_list_collections`
- `pocketbase_get_collection`
- `pocketbase_list_records`
- `pocketbase_get_record`
- `pocketbase_create_record`
- `pocketbase_update_record`
- `pocketbase_delete_record`

Record filters use the native PocketBase filter syntax. Record write tools accept
JSON-compatible fields; file upload payloads are intentionally not supported.
