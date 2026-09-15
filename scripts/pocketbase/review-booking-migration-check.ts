import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import type PocketBase from 'pocketbase';
import { createAdminClient, formatError, stableJson } from './lib';

const preservedFields = [
  'id',
  'sprint',
  'teacher',
  'student',
  'startTime',
  'endTime',
  'public_note',
  'status',
  'meetingLink',
  'roomNumber',
] as const;

type PreservedReview = Record<(typeof preservedFields)[number], unknown>;

function argument(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function assertLocal(pb: PocketBase) {
  const hostname = new URL(pb.baseURL).hostname;
  if (hostname !== '127.0.0.1' && hostname !== 'localhost') {
    throw new Error(`Refusing review migration check on non-local target: ${hostname}`);
  }
}

async function preservedReviews(pb: PocketBase): Promise<PreservedReview[]> {
  const reviews = await pb.collection('reviews').getFullList({ requestKey: null, sort: 'id' });
  return reviews.map((review) => Object.fromEntries(
    preservedFields.map((field) => [field, review[field] ?? '']),
  ) as PreservedReview);
}

async function snapshot(pb: PocketBase, filename: string) {
  const reviews = await preservedReviews(pb);
  await writeFile(filename, stableJson({ reviews }), 'utf8');
  console.log(stableJson({ phase: 'snapshot', reviews: reviews.length, filename }));
}

async function verify(pb: PocketBase, filename: string) {
  const before = JSON.parse(await readFile(filename, 'utf8')) as { reviews: PreservedReview[] };
  const after = await preservedReviews(pb);
  const afterById = new Map(after.map((review) => [review.id, review]));
  for (const review of before.reviews) {
    assert.deepEqual(afterById.get(review.id), review, `Review ${String(review.id)} changed during migration`);
  }

  const collection = await pb.collections.getOne('reviews');
  const ordinal = collection.fields.find((field) => field.name === 'bookingOrdinal');
  assert(ordinal, 'bookingOrdinal field is missing');
  assert.deepEqual(ordinal.values, ['first', 'second']);
  assert(collection.indexes.some((index) => index.includes('idx_reviews_sprint_student_ordinal')));
  assert.equal(collection.indexes.some((index) => index.includes('idx_reviews_sprint_student`')), false);

  const legacy = after.find((review) => review.roomNumber === 'HISTORICAL-REVIEW-BOOKED');
  assert(legacy?.student && legacy.sprint && legacy.teacher, 'Historical booked review fixture is missing');
  const reviews = pb.collection('reviews');
  let secondId: string | undefined;
  try {
    const second = await reviews.create({
      sprint: legacy.sprint,
      teacher: legacy.teacher,
      student: legacy.student,
      bookingOrdinal: 'second',
      startTime: '2025-03-20 11:00:00.000Z',
      endTime: '2025-03-20 11:20:00.000Z',
      roomNumber: 'MIGRATION-CHECK-SECOND',
      status: 'Pendiente',
    });
    secondId = second.id;
    await assert.rejects(() => reviews.create({
      sprint: legacy.sprint,
      teacher: legacy.teacher,
      student: legacy.student,
      bookingOrdinal: 'first',
      startTime: '2025-03-20 12:00:00.000Z',
      endTime: '2025-03-20 12:20:00.000Z',
      roomNumber: 'MIGRATION-CHECK-THIRD',
      status: 'Pendiente',
    }));
  } finally {
    if (secondId) await reviews.delete(secondId);
  }

  console.log(stableJson({
    phase: 'verify',
    preservedReviews: before.reviews.length,
    secondBookingAccepted: true,
    thirdBookingRejected: true,
  }));
}

async function main() {
  const mode = process.argv[2];
  const filename = argument('--file');
  if (!filename || (mode !== 'snapshot' && mode !== 'verify')) {
    throw new Error('Usage: review-booking-migration-check.ts <snapshot|verify> --file <path>');
  }
  const pb = await createAdminClient();
  assertLocal(pb);
  if (mode === 'snapshot') await snapshot(pb, filename);
  else await verify(pb, filename);
}

main().catch((error) => {
  console.error(formatError(error));
  process.exit(1);
});
