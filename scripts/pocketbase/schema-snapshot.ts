import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createAdminClient, formatError, parseCliOptions, sanitizeCollection, stableJson } from "./lib";

async function main() {
  const options = parseCliOptions(process.argv.slice(2));
  const output = path.resolve(options.output ?? "pocketbase/schema/snapshot.json");
  const pb = await createAdminClient();
  const collections = await pb.collections.getFullList({ sort: "name" });
  const snapshot = {
    formatVersion: 1,
    pocketbaseUrl: new URL(pb.baseURL).origin,
    collections: collections.map((collection) =>
      sanitizeCollection(collection as unknown as Record<string, unknown>),
    ),
  };

  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, stableJson(snapshot), "utf8");
  console.log(`PocketBase schema snapshot written to ${output}`);
}

main().catch((error) => {
  console.error(formatError(error));
  process.exit(1);
});
