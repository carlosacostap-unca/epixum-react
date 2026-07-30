import type PocketBase from 'pocketbase';
import type { Cohort, CohortRole, Enrollment, User } from '@/types';
import { createServerClient } from './pocketbase-server';
import { isEnrollmentCompatible } from './cohort-admin-policy';

export type CohortPermission = 'read' | 'manage-academics' | 'manage-students' | 'manage-teachers' | 'manage-cohort';

export type CohortContext = {
  user: User;
  cohort: Cohort;
  enrollment: Enrollment | null;
  cohortRole: CohortRole | null;
  isAdmin: boolean;
  permissions: ReadonlySet<CohortPermission>;
};

function permissionsFor(user: User, cohort: Cohort, enrollment: Enrollment | null): ReadonlySet<CohortPermission> {
  if (user.role === 'admin') {
    return cohort.status === 'archived'
      ? new Set(['read', 'manage-cohort'])
      : new Set(['read', 'manage-academics', 'manage-students', 'manage-teachers', 'manage-cohort']);
  }
  if (!enrollment || enrollment.status !== 'active' || !isEnrollmentCompatible(user.role, enrollment.role)) return new Set();
  if (cohort.status === 'archived') {
    return new Set(['read']);
  }
  if (enrollment.role === 'teacher') return new Set(['read', 'manage-academics', 'manage-students', 'manage-cohort']);
  return new Set(['read']);
}

export async function resolveCohortContext(cohortId: string, client?: PocketBase): Promise<CohortContext> {
  const pb = client ?? await createServerClient();
  if (!pb.authStore.isValid || !pb.authStore.model?.id) throw new Error('UNAUTHENTICATED');
  const [user, cohort] = await Promise.all([
    pb.collection('users').getOne<User>(pb.authStore.model.id),
    pb.collection('cohorts').getOne<Cohort>(cohortId, { expand: 'course' }),
  ]);
  let enrollment: Enrollment | null = null;
  if (user.role !== 'admin') {
    try {
      enrollment = await pb.collection('enrollments').getFirstListItem<Enrollment>(
        pb.filter('cohort = {:cohort} && user = {:user}', { cohort: cohortId, user: user.id }),
      );
    } catch {
      enrollment = null;
    }
  }
  const context = {
    user,
    cohort,
    enrollment,
    cohortRole: enrollment?.role ?? null,
    isAdmin: user.role === 'admin',
    permissions: permissionsFor(user, cohort, enrollment),
  } satisfies CohortContext;
  if (!context.permissions.has('read')) throw new Error('COHORT_ACCESS_DENIED');
  return context;
}

export function requireCohortPermission(context: CohortContext, permission: CohortPermission) {
  if (!context.permissions.has(permission)) throw new Error('COHORT_ACCESS_DENIED');
}

export function requireWritableCohort(context: CohortContext) {
  if (context.cohort.status === 'archived') throw new Error('COHORT_READ_ONLY');
}

type ScopedCollection = 'sprints' | 'classes' | 'assignments' | 'links' | 'deliveries' | 'reviews' | 'inquiries' | 'inquiry_responses';

export async function resolveRecordCohortId(pb: PocketBase, collection: ScopedCollection, recordId: string): Promise<string> {
  const record = await pb.collection(collection).getOne(recordId);
  if (collection === 'sprints' || collection === 'inquiries') {
    if (record.cohort) return String(record.cohort);
    if (collection === 'inquiries') {
      if (record.class) return resolveRecordCohortId(pb, 'classes', String(record.class));
      if (record.assignment) return resolveRecordCohortId(pb, 'assignments', String(record.assignment));
    }
  }
  if (collection === 'classes' || collection === 'assignments' || collection === 'reviews') {
    return resolveRecordCohortId(pb, 'sprints', String(record.sprint));
  }
  if (collection === 'links') {
    if (record.class) return resolveRecordCohortId(pb, 'classes', String(record.class));
    if (record.assignment) return resolveRecordCohortId(pb, 'assignments', String(record.assignment));
  }
  if (collection === 'deliveries') return resolveRecordCohortId(pb, 'assignments', String(record.assignment));
  if (collection === 'inquiry_responses') return resolveRecordCohortId(pb, 'inquiries', String(record.inquiry));
  throw new Error('RECORD_WITHOUT_COHORT');
}

export async function authorizeRecord(
  collection: ScopedCollection,
  recordId: string,
  permission: CohortPermission = 'read',
  client?: PocketBase,
) {
  const pb = client ?? await createServerClient();
  const cohortId = await resolveRecordCohortId(pb, collection, recordId);
  const context = await resolveCohortContext(cohortId, pb);
  requireCohortPermission(context, permission);
  return { pb, cohortId, context };
}

export function assertOwner(context: CohortContext, ownerId: string) {
  if (!context.isAdmin && context.user.id !== ownerId) throw new Error('RECORD_OWNERSHIP_DENIED');
}
