import type { Review } from '@/types';

type TeacherReviewContent = Pick<Review, 'public_note' | 'privateNote' | 'status'>;
type StudentCancellationReview = Pick<Review, 'startTime' | 'studentCancellationLocked'>;

export type StudentCancellationBlockReason = 'protected' | 'started' | 'invalid-start';

export function hasTeacherReviewContent(review: TeacherReviewContent): boolean {
  return Boolean(
    review.public_note?.trim()
    || review.privateNote?.trim()
    || (review.status && review.status !== 'Pendiente'),
  );
}

export function canStudentCancelReview(
  review: StudentCancellationReview,
  now: Date = new Date(),
): boolean {
  return getStudentCancellationBlockReason(review, now) === null;
}

export function getStudentCancellationBlockReason(
  review: StudentCancellationReview,
  now: Date = new Date(),
): StudentCancellationBlockReason | null {
  if (review.studentCancellationLocked === true) return 'protected';

  const startTime = Date.parse(review.startTime);
  const currentTime = now.getTime();
  if (!Number.isFinite(startTime) || !Number.isFinite(currentTime)) return 'invalid-start';
  if (startTime <= currentTime) return 'started';

  return null;
}
