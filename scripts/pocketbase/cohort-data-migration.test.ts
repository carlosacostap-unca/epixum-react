import assert from "node:assert/strict";
import test from "node:test";
import type { RecordModel } from "pocketbase";
import { contextualRole, deriveInitialCohortDates } from "./cohort-data-migration";

test("deriveInitialCohortDates is deterministic and spans all sprints", () => {
  const records = [
    { startDate: "2025-03-01 00:00:00.000Z", endDate: "2025-03-30 00:00:00.000Z" },
    { startDate: "2025-01-10 00:00:00.000Z", endDate: "2025-04-15 00:00:00.000Z" },
  ] as unknown as RecordModel[];
  assert.deepEqual(deriveInitialCohortDates(records), {
    startDate: "2025-01-10 00:00:00.000Z",
    endDate: "2025-04-15 00:00:00.000Z",
  });
});

test("global educational roles map to contextual roles and administrators stay global", () => {
  assert.equal(contextualRole("estudiante"), "student");
  assert.equal(contextualRole("docente"), "teacher");
  assert.equal(contextualRole("admin"), null);
});
