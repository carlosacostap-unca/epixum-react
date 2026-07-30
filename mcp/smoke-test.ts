import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [
      "node_modules/tsx/dist/cli.mjs",
      "--env-file=.env.local",
      "mcp/pocketbase-server.ts",
    ],
    stderr: "inherit",
  });

  const client = new Client({ name: "pocketbase-mcp-smoke-test", version: "1.0.0" });

  try {
    await client.connect(transport);
    const { tools } = await client.listTools();
    const health = await client.callTool({ name: "pocketbase_health", arguments: {} });

    if (health.isError) {
      throw new Error(JSON.stringify(health.content));
    }

    console.log(`MCP OK: ${tools.length} tools; PocketBase authentication OK.`);
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
