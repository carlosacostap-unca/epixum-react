import PocketBase, { ClientResponseError } from "pocketbase";

export const BASELINE_COLLECTIONS = [
  "users",
  "sprints",
  "classes",
  "assignments",
  "links",
  "deliveries",
  "reviews",
  "inquiries",
  "inquiry_responses",
] as const;

export type CliOptions = {
  dryRun: boolean;
  json: boolean;
  output?: string;
};

export function parseCliOptions(args: string[]): CliOptions {
  const outputIndex = args.indexOf("--output");
  return {
    dryRun: args.includes("--dry-run"),
    json: args.includes("--json"),
    output: outputIndex >= 0 ? args[outputIndex + 1] : undefined,
  };
}

export function requireEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export async function createAdminClient(): Promise<PocketBase> {
  const pb = new PocketBase(requireEnvironment("NEXT_PUBLIC_POCKETBASE_URL"));
  pb.autoCancellation(false);
  await pb
    .collection("_superusers")
    .authWithPassword(
      requireEnvironment("POCKETBASE_ADMIN_EMAIL"),
      requireEnvironment("POCKETBASE_ADMIN_PASSWORD"),
    );
  return pb;
}

export type SafeField = {
  name: string;
  type: string;
  required?: boolean;
  presentable?: boolean;
  collectionId?: string;
  cascadeDelete?: boolean;
  maxSelect?: number;
  values?: string[];
  min?: number;
  max?: number;
  pattern?: string;
};

export type SafeCollection = {
  id: string;
  name: string;
  type: string;
  system: boolean;
  fields: SafeField[];
  indexes: string[];
  listRule: string | null;
  viewRule: string | null;
  createRule: string | null;
  updateRule: string | null;
  deleteRule: string | null;
};

const SAFE_FIELD_KEYS = [
  "name",
  "type",
  "required",
  "presentable",
  "collectionId",
  "cascadeDelete",
  "maxSelect",
  "values",
  "min",
  "max",
  "pattern",
] as const;

export function sanitizeCollection(collection: Record<string, unknown>): SafeCollection {
  const fields = Array.isArray(collection.fields) ? collection.fields : [];
  return {
    id: String(collection.id ?? ""),
    name: String(collection.name ?? ""),
    type: String(collection.type ?? ""),
    system: Boolean(collection.system),
    fields: fields.map((field) => {
      const source = field as Record<string, unknown>;
      return Object.fromEntries(
        SAFE_FIELD_KEYS.filter((key) => source[key] !== undefined).map((key) => [key, source[key]]),
      ) as SafeField;
    }),
    indexes: Array.isArray(collection.indexes) ? collection.indexes.map(String) : [],
    listRule: typeof collection.listRule === "string" ? collection.listRule : null,
    viewRule: typeof collection.viewRule === "string" ? collection.viewRule : null,
    createRule: typeof collection.createRule === "string" ? collection.createRule : null,
    updateRule: typeof collection.updateRule === "string" ? collection.updateRule : null,
    deleteRule: typeof collection.deleteRule === "string" ? collection.deleteRule : null,
  };
}

export function formatError(error: unknown): string {
  if (error instanceof ClientResponseError) {
    return `PocketBase ${error.status || "network"}: ${error.response?.message || error.message}`;
  }
  return error instanceof Error ? error.message : String(error);
}

export function stableJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}
