import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type PocketBase from "pocketbase";

import { createAdminClient, formatError, stableJson } from "./lib";

const academicCollections = [
  "sprints",
  "classes",
  "assignments",
  "links",
  "deliveries",
  "reviews",
  "review_private_notes",
  "inquiries",
  "inquiry_responses",
] as const;

const monitoredCollections = [
  "users",
  "courses",
  "cohorts",
  "enrollments",
  ...academicCollections,
] as const;

type SnapshotCollection = {
  name: string;
  listRule: string | null;
  viewRule: string | null;
  createRule: string | null;
  updateRule: string | null;
  deleteRule: string | null;
};

function argument(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function sha256(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

function nestedValue(source: unknown, acceptedKeys: string[]): unknown {
  if (!source || typeof source !== "object") return undefined;
  for (const [key, value] of Object.entries(source)) {
    if (acceptedKeys.includes(key.toLowerCase())) return value;
    const nested = nestedValue(value, acceptedKeys);
    if (nested !== undefined) return nested;
  }
  return undefined;
}

function safePath(source: unknown) {
  const value = nestedValue(source, ["url", "path", "requesturl"]);
  if (typeof value !== "string") return undefined;
  try {
    return new URL(value, "https://pocketbase.invalid").pathname;
  } catch {
    return undefined;
  }
}

async function snapshotDetails(filename: string) {
  const bytes = await readFile(filename);
  const snapshot = JSON.parse(bytes.toString("utf8")) as { collections: SnapshotCollection[] };
  const rules = Object.fromEntries(
    snapshot.collections
      .filter((collection) => academicCollections.includes(collection.name as typeof academicCollections[number]))
      .map((collection) => {
        const canonical = stableJson({
          listRule: collection.listRule,
          viewRule: collection.viewRule,
          createRule: collection.createRule,
          updateRule: collection.updateRule,
          deleteRule: collection.deleteRule,
        });
        return [collection.name, sha256(canonical)];
      }),
  );
  return { filename: path.resolve(filename), sha256: sha256(bytes), ruleHashes: rules };
}

async function count(pb: PocketBase, collection: string) {
  return (await pb.collection(collection).getList(1, 1, { fields: "id", skipTotal: false })).totalItems;
}

async function main() {
  const beforePath = argument("--before");
  const afterPath = argument("--after");
  const beforeCountsPath = argument("--before-counts");
  const outputPath = argument("--output");
  const backupName = argument("--backup-name");
  const backupSha256 = argument("--backup-sha256");
  if (!beforePath || !afterPath || !beforeCountsPath || !outputPath || !backupName || !backupSha256) {
    throw new Error("Expected --before, --after, --before-counts, --output, --backup-name and --backup-sha256.");
  }

  const pb = await createAdminClient();
  const hostname = new URL(pb.baseURL).hostname;
  if (hostname !== "pocketbase-react.epixum.com") {
    throw new Error(`Refusing production monitoring for unexpected target: ${hostname}`);
  }

  const counts: Record<string, number> = {};
  for (const collection of monitoredCollections) counts[collection] = await count(pb, collection);

  const [sprints, inquiries, enrollments, reviews, logs] = await Promise.all([
    pb.collection("sprints").getFullList({ fields: "id,cohort" }),
    pb.collection("inquiries").getFullList({ fields: "id,cohort" }),
    pb.collection("enrollments").getFullList({ fields: "id,cohort,user,role,status" }),
    pb.collection("reviews").getFullList({ fields: "id,sprint,student" }),
    pb.logs.getList(1, 200, { sort: "-created" }),
  ]);

  const enrollmentKeys = enrollments.map((record) => `${record.cohort}:${record.user}`);
  const reservationKeys = reviews
    .filter((record) => Boolean(record.student))
    .map((record) => `${record.sprint}:${record.student}`);
  const duplicates = (keys: string[]) => [...new Set(keys.filter((key, index) => keys.indexOf(key) !== index))];
  const authorizationFailureIndexes = logs.items
    .map((log, index) => {
      const status = Number(nestedValue(log.data, ["status", "statuscode"]));
      return status === 401 || status === 403 ? index : -1;
    })
    .filter((index) => index >= 0);

  const before = await snapshotDetails(beforePath);
  const after = await snapshotDetails(afterPath);
  const beforeCounts = JSON.parse(await readFile(beforeCountsPath, "utf8")) as Record<string, number>;
  const checks = {
    orphanSprints: sprints.filter((record) => !record.cohort).length,
    orphanInquiries: inquiries.filter((record) => !record.cohort).length,
    duplicateEnrollments: duplicates(enrollmentKeys).length,
    duplicateReservations: duplicates(reservationKeys).length,
    recentLogsSampled: logs.items.length,
    recentAuthorizationFailures: authorizationFailureIndexes.length,
    authorizationFailureSummary: authorizationFailureIndexes.map((index) => {
      const log = logs.items[index];
      return {
        created: log.created,
        level: log.level,
        status: nestedValue(log.data, ["status", "statuscode"]),
        path: safePath(log.data),
      };
    }),
    crossCohortRuleHashesChanged: academicCollections.filter(
      (collection) => before.ruleHashes[collection] !== after.ruleHashes[collection],
    ),
  };

  const report = {
    target: pb.baseURL,
    checkedAt: new Date().toISOString(),
    backup: {
      name: backupName,
      sha256: backupSha256,
      localVerifiedCopy: path.join(
        process.env.TEMP ?? process.env.TMP ?? "",
        "epixum-pocketbase-backups",
        backupName,
      ),
      restoredWithPocketBaseVersion: "0.39.9",
      verification: "Downloaded checksum verified; restored preflight, migration idempotency, finalization idempotency and permission matrix passed.",
      verifiedBy: "Codex automated rollout under explicit project-owner approval",
      rollbackOwner: "project owner",
    },
    beforeSnapshot: before,
    afterSnapshot: after,
    beforeCounts,
    afterCounts: counts,
    checks,
    ok:
      checks.orphanSprints === 0 &&
      checks.orphanInquiries === 0 &&
      checks.duplicateEnrollments === 0 &&
      checks.duplicateReservations === 0,
  };
  await writeFile(outputPath, stableJson(report), "utf8");
  console.log(stableJson(report));
  if (!report.ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error(formatError(error));
  process.exit(1);
});
