import type { Review } from '@/types';

type TeacherReviewContent = Pick<Review, 'public_note' | 'privateNote' | 'status'>;

export function hasTeacherReviewContent(review: TeacherReviewContent): boolean {
  return Boolean(
    review.public_note?.trim()
    || review.privateNote?.trim()
    || (review.status && review.status !== 'Pendiente'),
  );
}

export function canStudentCancelReview(
  review: Pick<Review, 'studentCancellationLocked'>,
): boolean {
  return review.studentCancellationLocked !== true;
}
