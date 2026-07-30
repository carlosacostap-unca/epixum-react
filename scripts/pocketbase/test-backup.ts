import { createAdminClient, formatError, stableJson } from "./lib";

async function main() {
  const pb = await createAdminClient();
  const hostname = new URL(pb.baseURL).hostname;
  if (hostname !== "127.0.0.1" && hostname !== "localhost") {
    throw new Error(`Refusing backup test operation on non-local target: ${hostname}`);
  }
  const operation = process.argv[2];
  const name = process.argv[3] ?? "pre-cohort-migration.zip";
  if (operation === "create") await pb.backups.create(name);
  else if (operation === "restore") await pb.backups.restore(name);
  else if (operation !== "list") throw new Error("Expected create, restore or list.");
  const backups = operation === "restore" ? [] : await pb.backups.getFullList();
  console.log(stableJson({ operation, name, backups }));
}

main().catch((error) => {
  console.error(formatError(error));
  process.exit(1);
});
