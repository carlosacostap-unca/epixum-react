import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { cookies } from 'next/headers';
import PocketBase from 'pocketbase';
import type { Cohort, Course, Enrollment, User } from '@/types';
import { createServerClient, getCurrentUser } from './pocketbase-server';
import { requireCohortPermission, resolveCohortContext } from './cohort-context';
import { cohortCacheKey, cohortCacheTag } from './cohort-cache';
import { ACTIVE_COHORT_COOKIE, selectPreferredCohort, selectableCohorts } from './cohort-navigation';

function participantFetcher(cohortId: string, userId: string) {
  return unstable_cache(async (token: string | undefined) => {
    const pb = new PocketBase(process.env['NEXT_PUBLIC_POCKETBASE_URL']);
    pb.autoCancellation(false);
    if (token) pb.authStore.loadFromCookie(`pb_auth=${token}`);
    return pb.collection('enrollments').getFullList<Enrollment>({
      filter: pb.filter('cohort = {:cohort}', { cohort: cohortId }),
      sort: 'role,user.name',
      expand: 'user',
    });
  }, [...cohortCacheKey(cohortId, 'participants', userId)], {
    revalidate: 60,
    tags: [cohortCacheTag(cohortId, 'participants')],
  });
}

export const getAccessibleCohorts = cache(async (): Promise<Cohort[]> => {
  const [pb, user] = await Promise.all([createServerClient(), getCurrentUser()]);
  if (!user) return [];
  if (user.role === 'admin') {
    return pb.collection('cohorts').getFullList<Cohort>({ sort: '-startDate', expand: 'course' });
  }
  const enrollments = await pb.collection('enrollments').getFullList<Enrollment>({
    filter: pb.filter('user = {:user} && status = "active"', { user: user.id }),
    expand: 'cohort,cohort.course',
    sort: '-cohort.startDate',
  });
  return enrollments.flatMap((enrollment) => enrollment.expand?.cohort ? [enrollment.expand.cohort] : []);
});

export async function getActiveCohort(cohortId: string) {
  return (await resolveCohortContext(cohortId)).cohort;
}

export const getDefaultAccessibleCohort = cache(async () => {
  const cohorts = await getAccessibleCohorts();
  const rememberedCohortId = (await cookies()).get(ACTIVE_COHORT_COOKIE)?.value;
  return selectPreferredCohort(cohorts, rememberedCohortId);
});

export const getCohortNavigationState = cache(async () => {
  const cohorts = await getAccessibleCohorts();
  const rememberedCohortId = (await cookies()).get(ACTIVE_COHORT_COOKIE)?.value;
  const options = selectableCohorts(cohorts);
  return {
    cohorts: options,
    activeCohort: selectPreferredCohort(options, rememberedCohortId),
  };
});

export async function getCourses(): Promise<Course[]> {
  const pb = await createServerClient();
  return pb.collection('courses').getFullList<Course>({ sort: 'name' });
}

export async function getCourseCohorts(courseId: string): Promise<Cohort[]> {
  const pb = await createServerClient();
  return pb.collection('cohorts').getFullList<Cohort>({
    filter: pb.filter('course = {:course}', { course: courseId }),
    sort: '-startDate',
    expand: 'course',
  });
}

export async function getCohortParticipants(cohortId: string): Promise<Enrollment[]> {
  const context = await resolveCohortContext(cohortId);
  const token = (await cookies()).get('pb_auth')?.value;
  return participantFetcher(cohortId, context.user.id)(token);
}

export async function getParticipantCandidates(cohortId: string): Promise<User[]> {
  const context = await resolveCohortContext(cohortId);
  requireCohortPermission(context, 'manage-students');
  const pb = await createServerClient();
  return pb.collection('users').getFullList<User>({
    filter: 'role = "estudiante" || role = "docente"',
    sort: 'role,name,email',
  });
}
