import type { Review, ReviewBookingOrdinal } from '@/types';

export const MAX_REVIEW_BOOKINGS_PER_SPRINT = 2;

type BookingRecord = Pick<Review, 'bookingOrdinal'>;
type DatedReview = Pick<Review, 'id' | 'startTime' | 'created'>;

export function normalizeBookingOrdinal(review: BookingRecord): ReviewBookingOrdinal {
  return review.bookingOrdinal === 'second' ? 'second' : 'first';
}

export function nextBookingOrdinal(bookings: BookingRecord[]): ReviewBookingOrdinal | null {
  if (bookings.length >= MAX_REVIEW_BOOKINGS_PER_SPRINT) return null;
  const used = new Set(bookings.map(normalizeBookingOrdinal));
  if (!used.has('first')) return 'first';
  if (!used.has('second')) return 'second';
  return null;
}

function compareReviewRecency(left: DatedReview, right: DatedReview) {
  return left.startTime.localeCompare(right.startTime)
    || left.created.localeCompare(right.created)
    || left.id.localeCompare(right.id);
}

export function latestReview<T extends DatedReview>(reviews: T[]): T | undefined {
  return reviews.reduce<T | undefined>(
    (latest, review) => !latest || compareReviewRecency(review, latest) > 0 ? review : latest,
    undefined,
  );
}
