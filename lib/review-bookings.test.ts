import assert from 'node:assert/strict';
import test from 'node:test';
import type { Review } from '@/types';
import { latestReview, nextBookingOrdinal, normalizeBookingOrdinal } from './review-bookings';

const datedReview = (id: string, startTime: string, created: string, status: Review['status']): Review => ({
  id,
  startTime,
  created,
  status,
} as Review);

test('legacy bookings without an ordinal occupy the first position', () => {
  assert.equal(normalizeBookingOrdinal({}), 'first');
  assert.equal(nextBookingOrdinal([]), 'first');
  assert.equal(nextBookingOrdinal([{}]), 'second');
});

test('two bookings fill the quota and no third position is returned', () => {
  assert.equal(nextBookingOrdinal([{ bookingOrdinal: 'first' }, { bookingOrdinal: 'second' }]), null);
  assert.equal(nextBookingOrdinal([{}, { bookingOrdinal: 'second' }]), null);
});

test('the latest review is selected by start time, creation time and id', () => {
  const reviews = [
    datedReview('a', '2026-09-01 10:00:00.000Z', '2026-08-01 10:00:00.000Z', 'Desaprobado'),
    datedReview('b', '2026-09-02 10:00:00.000Z', '2026-08-01 10:00:00.000Z', 'Aprobado'),
  ];
  assert.equal(latestReview(reviews)?.status, 'Aprobado');

  const tied = [
    datedReview('a', '2026-09-02 10:00:00.000Z', '2026-08-01 10:00:00.000Z', 'Pendiente'),
    datedReview('b', '2026-09-02 10:00:00.000Z', '2026-08-02 10:00:00.000Z', 'Aprobado'),
  ];
  assert.equal(latestReview(tied)?.id, 'b');
});
