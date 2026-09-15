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
const cancellationMigrationPath = new URL('../../pb_migrations/1789500000_protect_reviewed_bookings.js', import.meta.url);
const cancellationSource = readFileSync(cancellationMigrationPath, 'utf8');

test('review cancellation migration derives protection without changing academic fields', () => {
  assert.match(cancellationSource, /studentCancellationLocked/);
  assert.match(cancellationSource, /TRIM\(COALESCE\(public_note/);
  assert.match(cancellationSource, /review_private_notes\.content/);
  assert.match(cancellationSource, /COALESCE\(status, ''\) NOT IN \('', 'Pendiente'\)/);
  assert.match(cancellationSource, /studentCancellationLocked:changed = false/);
  assert.doesNotMatch(cancellationSource, /DELETE FROM reviews|UPDATE reviews\s+SET\s+(student|bookingOrdinal|public_note|status)\s*=/i);
});
