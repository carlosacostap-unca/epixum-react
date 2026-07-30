#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import PocketBase, { ClientResponseError } from "pocketbase";
import { z } from "zod/v4";

function requireEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`PocketBase MCP requires ${name}.`);
    process.exit(1);
  }
  return value;
}

const url = requireEnvironment("NEXT_PUBLIC_POCKETBASE_URL");
const email = requireEnvironment("POCKETBASE_ADMIN_EMAIL");
const password = requireEnvironment("POCKETBASE_ADMIN_PASSWORD");
const readOnly = process.env.POCKETBASE_MCP_READ_ONLY?.toLowerCase() !== "false";

const pb = new PocketBase(url);
pb.autoCancellation(false);

let authentication: Promise<void> | undefined;

async function authenticate(): Promise<void> {
  if (pb.authStore.isValid) return;

  authentication ??= pb
    .collection("_superusers")
    .authWithPassword(email, password)
    .then(() => undefined)
    .catch((error) => {
      authentication = undefined;
      throw error;
    });

  await authentication;
}

function jsonResult(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
  };
}

function errorResult(error: unknown) {
  if (error instanceof ClientResponseError) {
    const details = error.response?.data ?? error.response?.message;
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              error: error.message,
              status: error.status,
              ...(details ? { details } : {}),
            },
            null,
            2,
          ),
        },
      ],
      isError: true,
    };
  }

  return {
    content: [
      {
        type: "text" as const,
        text: error instanceof Error ? error.message : String(error),
      },
    ],
    isError: true,
  };
}

async function run<T>(operation: () => Promise<T>) {
  try {
    await authenticate();
    return jsonResult(await operation());
  } catch (error) {
    return errorResult(error);
  }
}

async function runWrite<T>(operation: () => Promise<T>) {
  if (readOnly) {
    return {
      content: [
        {
          type: "text" as const,
          text: "Write operations are disabled. Set POCKETBASE_MCP_READ_ONLY=false to enable them.",
        },
      ],
      isError: true,
    };
  }

  return run(operation);
}

const server = new McpServer(
  { name: "epixum-pocketbase", version: "1.0.0" },
  {
    instructions:
      "Inspect collections before querying them. Use PocketBase filter syntax. Writes are disabled unless POCKETBASE_MCP_READ_ONLY=false.",
  },
);

server.registerTool(
  "pocketbase_health",
  {
    title: "Check PocketBase connection",
    description: "Authenticates as the configured superuser and reports connection status without exposing credentials or tokens.",
    inputSchema: {},
    annotations: { readOnlyHint: true, idempotentHint: true },
  },
  async () =>
    run(async () => ({
      ok: true,
      url: pb.baseURL,
      authenticated: pb.authStore.isValid,
      readOnly,
    })),
);

server.registerTool(
  "pocketbase_list_collections",
  {
    title: "List PocketBase collections",
    description: "Lists PocketBase collections and their schemas, rules, indexes, and collection types.",
    inputSchema: {},
    annotations: { readOnlyHint: true, idempotentHint: true },
  },
  async () => run(() => pb.collections.getFullList({ sort: "name" })),
);

server.registerTool(
  "pocketbase_get_collection",
  {
    title: "Get a PocketBase collection",
    description: "Returns the schema and configuration for one collection by name or ID.",
    inputSchema: {
      collection: z.string().min(1).describe("Collection name or ID"),
    },
    annotations: { readOnlyHint: true, idempotentHint: true },
  },
  async ({ collection }) => run(() => pb.collections.getOne(collection)),
);

server.registerTool(
  "pocketbase_list_records",
  {
    title: "List PocketBase records",
    description: "Returns a paginated record list. Filter expressions use PocketBase filter syntax.",
    inputSchema: {
      collection: z.string().min(1).describe("Collection name or ID"),
      page: z.number().int().min(1).default(1),
      perPage: z.number().int().min(1).max(200).default(30),
      filter: z.string().optional().describe("PocketBase filter expression"),
      sort: z.string().optional().describe("Comma-separated PocketBase sort fields, prefix descending fields with -"),
      expand: z.string().optional().describe("Comma-separated relation fields to expand"),
      fields: z.string().optional().describe("Comma-separated response fields to include"),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ collection, page, perPage, filter, sort, expand, fields }) =>
    run(() =>
      pb.collection(collection).getList(page, perPage, {
        ...(filter ? { filter } : {}),
        ...(sort ? { sort } : {}),
        ...(expand ? { expand } : {}),
        ...(fields ? { fields } : {}),
      }),
    ),
);

server.registerTool(
  "pocketbase_get_record",
  {
    title: "Get a PocketBase record",
    description: "Returns one record by collection and record ID.",
    inputSchema: {
      collection: z.string().min(1).describe("Collection name or ID"),
      id: z.string().min(1).describe("Record ID"),
      expand: z.string().optional().describe("Comma-separated relation fields to expand"),
      fields: z.string().optional().describe("Comma-separated response fields to include"),
    },
    annotations: { readOnlyHint: true, idempotentHint: true },
  },
  async ({ collection, id, expand, fields }) =>
    run(() =>
      pb.collection(collection).getOne(id, {
        ...(expand ? { expand } : {}),
        ...(fields ? { fields } : {}),
      }),
    ),
);

const recordData = z
  .record(z.string(), z.unknown())
  .describe("Record fields as a JSON object. File uploads are not supported by this tool.");

server.registerTool(
  "pocketbase_create_record",
  {
    title: "Create a PocketBase record",
    description: "Creates one record. Disabled while POCKETBASE_MCP_READ_ONLY is not false.",
    inputSchema: {
      collection: z.string().min(1).describe("Collection name or ID"),
      data: recordData,
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  },
  async ({ collection, data }) => runWrite(() => pb.collection(collection).create(data)),
);

server.registerTool(
  "pocketbase_update_record",
  {
    title: "Update a PocketBase record",
    description: "Updates one record. Disabled while POCKETBASE_MCP_READ_ONLY is not false.",
    inputSchema: {
      collection: z.string().min(1).describe("Collection name or ID"),
      id: z.string().min(1).describe("Record ID"),
      data: recordData,
    },
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
  },
  async ({ collection, id, data }) =>
    runWrite(() => pb.collection(collection).update(id, data)),
);

server.registerTool(
  "pocketbase_delete_record",
  {
    title: "Delete a PocketBase record",
    description: "Permanently deletes one record. Disabled while POCKETBASE_MCP_READ_ONLY is not false.",
    inputSchema: {
      collection: z.string().min(1).describe("Collection name or ID"),
      id: z.string().min(1).describe("Record ID"),
    },
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
  },
  async ({ collection, id }) =>
    runWrite(async () => {
      await pb.collection(collection).delete(id);
      return { deleted: true, collection, id };
    }),
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`PocketBase MCP running on stdio (${readOnly ? "read-only" : "write-enabled"}).`);
}

main().catch((error) => {
  console.error("PocketBase MCP failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
