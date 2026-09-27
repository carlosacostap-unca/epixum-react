import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canStudentCancelReview,
  getStudentCancellationBlockReason,
  hasTeacherReviewContent,
} from './review-cancellation';

test('an empty or pending review has no teacher content', () => {
  assert.equal(hasTeacherReviewContent({}), false);
  assert.equal(hasTeacherReviewContent({ public_note: '  ', privateNote: '', status: 'Pendiente' }), false);
});

test('public feedback, a private note or a final verdict counts as teacher content', () => {
  assert.equal(hasTeacherReviewContent({ public_note: 'Buen trabajo' }), true);
  assert.equal(hasTeacherReviewContent({ privateNote: 'Revisar defensa oral' }), true);
  for (const status of ['Aprobado', 'No presentó', 'Desaprobado'] as const) {
    assert.equal(hasTeacherReviewContent({ status }), true);
  }
});

test('students can cancel only unlocked reviews that have not started', () => {
  const now = new Date('2026-09-26T15:00:00.000Z');
  const futureReview = { startTime: '2026-09-26T15:00:01.000Z' };

  assert.equal(canStudentCancelReview(futureReview, now), true);
  assert.equal(canStudentCancelReview({ ...futureReview, studentCancellationLocked: false }, now), true);
  assert.equal(canStudentCancelReview({ ...futureReview, studentCancellationLocked: true }, now), false);
  assert.equal(canStudentCancelReview({ startTime: now.toISOString() }, now), false);
  assert.equal(canStudentCancelReview({ startTime: '2026-09-26T14:59:59.000Z' }, now), false);
  assert.equal(canStudentCancelReview({ startTime: 'not-a-date' }, now), false);
});

test('student cancellation reports the reason it is blocked', () => {
  const now = new Date('2026-09-26T15:00:00.000Z');

  assert.equal(getStudentCancellationBlockReason({
    startTime: '2026-09-26T16:00:00.000Z',
    studentCancellationLocked: true,
  }, now), 'protected');
  assert.equal(getStudentCancellationBlockReason({ startTime: now.toISOString() }, now), 'started');
  assert.equal(getStudentCancellationBlockReason({ startTime: 'invalid' }, now), 'invalid-start');
  assert.equal(getStudentCancellationBlockReason({ startTime: '2026-09-26T16:00:00.000Z' }, now), null);
});
