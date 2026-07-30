import type { Review, ReviewPrivateNote } from '@/types';

type ReviewRecord = Review & Record<string, unknown>;

export function withoutPrivateReviewFields(review: Review): Review {
  const sanitized = { ...review } as ReviewRecord;
  delete sanitized.private_note;
  delete sanitized.privateNote;
  return sanitized;
}

export function attachPrivateReviewNote(review: Review, note?: ReviewPrivateNote): Review {
  return {
    ...withoutPrivateReviewFields(review),
    privateNote: note?.content ?? '',
  };
}

export function attachPrivateReviewNotes(reviews: Review[], notes: ReviewPrivateNote[]): Review[] {
  const notesByReview = new Map(notes.map((note) => [note.review, note]));
  return reviews.map((review) => attachPrivateReviewNote(review, notesByReview.get(review.id)));
}
