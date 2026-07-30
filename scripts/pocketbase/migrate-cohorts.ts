import { createAdminClient, formatError, stableJson } from "./lib";
import { ensureCohortSchema } from "./cohort-schema";
import { migrateCohortData, planCohortDataBeforeSchema, type MigrationPhase } from "./cohort-data-migration";
import { ensureFinalCohortSchema } from "./cohort-final-schema";

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const schemaOnly = args.includes("--schema-only");
  const finalize = args.includes("--finalize");
  const stopAfter = args.find((argument) => argument.startsWith("--stop-after="))?.split("=")[1] as MigrationPhase | undefined;
  if (apply && process.env.POCKETBASE_COHORT_MIGRATION_APPROVED !== "true") {
    throw new Error("Write mode requires POCKETBASE_COHORT_MIGRATION_APPROVED=true and an isolated test target or explicit production approval.");
  }

  const pb = await createAdminClient();
  const changes = finalize ? [] : await ensureCohortSchema(pb, apply);
  const data = schemaOnly
    ? null
    : (!apply && changes.length > 0
      ? await planCohortDataBeforeSchema(pb)
      : await migrateCohortData(pb, { apply, stopAfter }));
  const finalChanges = finalize ? await ensureFinalCohortSchema(pb, apply) : [];
  const report = {
    mode: apply ? "apply" : "dry-run",
    target: new URL(pb.baseURL).origin,
    schemaOnly,
    changes,
    data,
    finalChanges,
    changed: changes.length > 0 || finalChanges.length > 0 || Boolean(data && (
      Object.values(data.created).some(Boolean) || Object.values(data.updated).some(Boolean)
    )),
  };
  console.log(stableJson(report));

  if (!schemaOnly && changes.length && !apply) {
    console.log("Dry run only. Re-run with --apply after completing the migration runbook checkpoints.");
  }
}

main().catch((error) => {
  console.error(formatError(error));
  process.exit(1);
});
