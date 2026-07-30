import assert from "node:assert/strict";
import test from "node:test";
import { cohortCollectionDefinitions, ensureCollection } from "./cohort-schema";

function fakePocketBase(existing?: Record<string, unknown>) {
  const calls: Array<{ kind: string; value: unknown }> = [];
  return {
    calls,
    collections: {
      async getOne() {
        if (!existing) throw Object.assign(new Error("missing"), { status: 404, response: {} });
        return existing;
      },
      async create(value: unknown) { calls.push({ kind: "create", value }); return value; },
      async update(_id: string, value: unknown) { calls.push({ kind: "update", value }); return value; },
    },
  };
}

test("ensureCollection reports no change for an identical collection", async () => {
  const existing = {
    id: "courses-id",
    name: "courses",
    type: "base",
    fields: [{ id: "field-id", name: "name", type: "text", required: true }],
    indexes: [],
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
  };
  const pb = fakePocketBase(existing);
  const result = await ensureCollection(pb as never, {
    name: "courses",
    type: "base",
    fields: [{ name: "name", type: "text", required: true }],
    indexes: [],
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
  }, true);
  assert.equal(result, null);
  assert.equal(pb.calls.length, 0);
});

test("ensureCollection plans and applies a missing field once", async () => {
  const existing = {
    id: "courses-id",
    name: "courses",
    type: "base",
    fields: [],
    indexes: [],
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
  };
  const pb = fakePocketBase(existing);
  const result = await ensureCollection(pb as never, {
    name: "courses",
    type: "base",
    fields: [{ name: "name", type: "text", required: true }],
    indexes: [],
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
  }, true);
  assert.deepEqual(result?.fields, ["name"]);
  assert.equal(pb.calls[0]?.kind, "update");
});

test("enrollment rules let assigned teachers manage students but never teachers", () => {
  const enrollment = cohortCollectionDefinitions({ users: 'users', courses: 'courses', cohorts: 'cohorts', reviews: 'reviews' })
    .find((definition) => definition.name === 'enrollments');
  assert.match(enrollment?.createRule ?? '', /@request\.body\.role = "student"/);
  assert.match(enrollment?.createRule ?? '', /@request\.body\.user\.role = "estudiante"/);
  assert.match(enrollment?.createRule ?? '', /enrollments:manager/);
  assert.match(enrollment?.updateRule ?? '', /role = "student"/);
  assert.match(enrollment?.updateRule ?? '', /@request\.body\.role:changed = false/);
  assert.equal(enrollment?.deleteRule, '@request.auth.role = "admin"');
});

test("archived cohorts cannot be mutated directly by teachers", () => {
  const cohort = cohortCollectionDefinitions({ users: 'users', courses: 'courses', cohorts: 'cohorts', reviews: 'reviews' })
    .find((definition) => definition.name === 'cohorts');
  assert.match(cohort?.updateRule ?? '', /status != "archived"/);
  assert.match(cohort?.updateRule ?? '', /@request\.body\.status = "archived"/);
});
