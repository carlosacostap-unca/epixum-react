import type PocketBase from "pocketbase";
import { BASELINE_COLLECTIONS, createAdminClient, formatError, parseCliOptions, stableJson } from "./lib";

type Check = { name: string; ok: boolean; details?: unknown };

async function count(pb: PocketBase, collection: string): Promise<number> {
  return (await pb.collection(collection).getList(1, 1, { fields: "id", skipTotal: false })).totalItems;
}

export async function runPreflight(pb: PocketBase) {
  const allCollections = await pb.collections.getFullList({ sort: "name" });
  const collectionNames = new Set(allCollections.map((collection) => collection.name));
  const checks: Check[] = BASELINE_COLLECTIONS.map((name) => ({
    name: `collection:${name}`,
    ok: collectionNames.has(name),
  }));

  const missing = checks.filter((check) => !check.ok).map((check) => check.name.split(":")[1]);
  const counts: Record<string, number> = {};
  for (const name of BASELINE_COLLECTIONS) {
    if (collectionNames.has(name)) counts[name] = await count(pb, name);
  }

  const brokenRelations: Array<{ collection: string; recordId: string; relation: string }> = [];
  if (!missing.length) {
    const [classes, assignments, deliveries, reviews, responses] = await Promise.all([
      pb.collection("classes").getFullList({ fields: "id,sprint" }),
      pb.collection("assignments").getFullList({ fields: "id,sprint" }),
      pb.collection("deliveries").getFullList({ fields: "id,assignment,student" }),
      pb.collection("reviews").getFullList({ fields: "id,sprint,teacher,student" }),
      pb.collection("inquiry_responses").getFullList({ fields: "id,inquiry,author" }),
    ]);

    for (const record of classes) if (!record.sprint) brokenRelations.push({ collection: "classes", recordId: record.id, relation: "sprint" });
    for (const record of assignments) if (!record.sprint) brokenRelations.push({ collection: "assignments", recordId: record.id, relation: "sprint" });
    for (const record of deliveries) {
      if (!record.assignment) brokenRelations.push({ collection: "deliveries", recordId: record.id, relation: "assignment" });
      if (!record.student) brokenRelations.push({ collection: "deliveries", recordId: record.id, relation: "student" });
    }
    for (const record of reviews) {
      if (!record.sprint) brokenRelations.push({ collection: "reviews", recordId: record.id, relation: "sprint" });
      if (!record.teacher) brokenRelations.push({ collection: "reviews", recordId: record.id, relation: "teacher" });
    }
    for (const record of responses) {
      if (!record.inquiry) brokenRelations.push({ collection: "inquiry_responses", recordId: record.id, relation: "inquiry" });
      if (!record.author) brokenRelations.push({ collection: "inquiry_responses", recordId: record.id, relation: "author" });
    }
  }

  checks.push({ name: "required-relations", ok: brokenRelations.length === 0, details: brokenRelations });
  return {
    mode: "read-only",
    ok: checks.every((check) => check.ok),
    checkedAt: new Date().toISOString(),
    counts,
    checks,
  };
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2));
  const report = await runPreflight(await createAdminClient());
  if (options.json) console.log(stableJson(report));
  else {
    console.log(`PocketBase cohort preflight (${options.dryRun ? "dry run" : "read-only"}): ${report.ok ? "OK" : "FAILED"}`);
    for (const [name, value] of Object.entries(report.counts)) console.log(`  ${name}: ${value}`);
    for (const check of report.checks.filter((item) => !item.ok)) console.error(`  FAILED ${check.name}`);
  }
  if (!report.ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error(formatError(error));
  process.exit(1);
});
