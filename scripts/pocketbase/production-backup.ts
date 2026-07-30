import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ClientResponseError } from "pocketbase";

import { createAdminClient, formatError, stableJson } from "./lib";

async function main() {
  if (process.env.POCKETBASE_PRODUCTION_BACKUP_APPROVED !== "true") {
    throw new Error("Production backup requires POCKETBASE_PRODUCTION_BACKUP_APPROVED=true.");
  }

  const pb = await createAdminClient();
  const hostname = new URL(pb.baseURL).hostname;
  if (hostname !== "pocketbase-react.epixum.com") {
    throw new Error(`Refusing production backup for unexpected target: ${hostname}`);
  }

  const outputDir = process.argv[2];
  if (!outputDir || !path.isAbsolute(outputDir)) {
    throw new Error("Expected an absolute backup output directory.");
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").toLowerCase();
  const name = `pre-cohort-migration-${timestamp}.zip`;
  await pb.backups.create(name);

  const backups = await pb.backups.getFullList();
  const backup = backups.find((candidate) => candidate.key === name);
  if (!backup) throw new Error(`PocketBase did not list the newly created backup: ${name}`);

  const token = await pb.files.getToken();
  const response = await fetch(pb.backups.getDownloadURL(token, name));
  if (!response.ok) throw new Error(`Backup download failed with HTTP ${response.status}`);

  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length === 0) throw new Error("Downloaded backup is empty.");
  await mkdir(outputDir, { recursive: true });
  const output = path.join(outputDir, name);
  await writeFile(output, bytes);

  const persisted = await readFile(output);
  const sha256 = createHash("sha256").update(persisted).digest("hex");
  console.log(stableJson({
    target: pb.baseURL,
    name,
    modified: backup.modified,
    size: persisted.length,
    sha256,
    output,
  }));
}

main().catch((error) => {
  console.error(formatError(error));
  if (error instanceof ClientResponseError && error.response?.data) {
    console.error(stableJson({ data: error.response.data }));
  }
  process.exit(1);
});
