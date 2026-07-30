import assert from "node:assert/strict";
import test from "node:test";
import { parseCliOptions, sanitizeCollection, stableJson } from "./lib";

test("sanitizeCollection exports only schema metadata", () => {
  const sanitized = sanitizeCollection({
    id: "abc",
    name: "users",
    type: "auth",
    system: false,
    tokenKey: "secret-token-key",
    passwordAuth: { enabled: true },
    fields: [
      { name: "email", type: "email", required: true, hidden: false },
      { name: "password", type: "password", required: true, secret: "never-export" },
    ],
    indexes: ["CREATE UNIQUE INDEX email_idx ON users (email)"],
    listRule: "@request.auth.id != ''",
  });

  const output = stableJson(sanitized);
  assert.equal(sanitized.name, "users");
  assert.equal(sanitized.fields.length, 2);
  assert.doesNotMatch(output, /secret-token-key|never-export|passwordAuth/);
});

test("parseCliOptions handles dry run, json and output", () => {
  assert.deepEqual(parseCliOptions(["--dry-run", "--json", "--output", "schema.json"]), {
    dryRun: true,
    json: true,
    output: "schema.json",
  });
});

test("stableJson is deterministic for already ordered input", () => {
  const value = { version: 1, collections: [{ name: "a" }] };
  assert.equal(stableJson(value), stableJson(value));
  assert.ok(stableJson(value).endsWith("\n"));
});
