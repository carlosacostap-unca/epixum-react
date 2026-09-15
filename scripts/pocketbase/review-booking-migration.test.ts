import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migrationPath = new URL('../../pb_migrations/1789000000_allow_two_review_bookings.js', import.meta.url);
const source = readFileSync(migrationPath, 'utf8');

test('review booking migration changes schema without mutating review records', () => {
  assert.match(source, /bookingOrdinal/);
  assert.match(source, /idx_reviews_sprint_student_ordinal/);
  assert.match(source, /fields\.add/);
  assert.doesNotMatch(source, /collection\(["']reviews["']\)\.(create|update|delete)/);
});

test('rollback refuses to discard double bookings', () => {
  assert.match(source, /HAVING COUNT\(\*\) > 1/);
  assert.match(source, /no reviews were changed/);
});
