import assert from "node:assert/strict";
import test from "node:test";
import { finalEducationalRules } from "./cohort-final-schema";

test("every educational collection has closed read and mutation rules", () => {
  const rules = finalEducationalRules();
  for (const [collection, ruleSet] of Object.entries(rules)) {
    for (const [operation, rule] of Object.entries(ruleSet)) {
      assert.equal(typeof rule, "string", `${collection}.${operation}`);
      assert.notEqual(rule, "", `${collection}.${operation}`);
    }
  }
});

test("student review update is self-booking only and protects evaluation fields", () => {
  const rule = finalEducationalRules().reviews.updateRule ?? "";
  assert.match(rule, /student = @request\.auth\.id/);
  for (const field of ["sprint", "teacher", "startTime", "endTime", "public_note", "status", "meetingLink", "roomNumber"]) {
    assert.match(rule, new RegExp(`@request\\.body\\.${field}:changed = false`));
  }
});

test("review rules never reference the legacy private note field", () => {
  const rules = finalEducationalRules().reviews;
  assert.doesNotMatch(JSON.stringify(rules), /private_note/);
});

test("private review notes require a cohort teacher or administrator", () => {
  const rules = finalEducationalRules().review_private_notes;
  assert.match(rules.listRule ?? "", /enrollments\.role \?= "teacher"/);
  assert.match(rules.listRule ?? "", /@request\.auth\.role = "admin"/);
});
