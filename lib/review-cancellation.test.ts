import assert from 'node:assert/strict';
import test from 'node:test';
import { canStudentCancelReview, hasTeacherReviewContent } from './review-cancellation';

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

test('students can cancel only reviews without the persisted lock', () => {
  assert.equal(canStudentCancelReview({}), true);
  assert.equal(canStudentCancelReview({ studentCancellationLocked: false }), true);
  assert.equal(canStudentCancelReview({ studentCancellationLocked: true }), false);
});
