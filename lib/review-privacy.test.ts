import assert from 'node:assert/strict';
import test from 'node:test';
import type { Review, ReviewPrivateNote } from '@/types';
import { attachPrivateReviewNote, withoutPrivateReviewFields } from './review-privacy';

const review = {
  id: 'review-a',
  sprint: 'sprint-a',
  teacher: 'teacher-a',
  startTime: '2026-01-01T10:00:00.000Z',
  endTime: '2026-01-01T10:15:00.000Z',
  private_note: 'legacy secret',
} as unknown as Review;

test('student-safe reviews omit both legacy and application-only private note fields', () => {
  const safe = withoutPrivateReviewFields({ ...review, privateNote: 'protected secret' });
  assert.equal('private_note' in safe, false);
  assert.equal('privateNote' in safe, false);
  assert.equal(JSON.stringify(safe).includes('secret'), false);
});

test('private notes are attached only through the protected note record', () => {
  const note = { review: review.id, content: 'protected secret' } as ReviewPrivateNote;
  const enriched = attachPrivateReviewNote(review, note);
  assert.equal(enriched.privateNote, 'protected secret');
  assert.equal('private_note' in enriched, false);
});
