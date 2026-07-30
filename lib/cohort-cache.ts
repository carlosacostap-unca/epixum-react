import { revalidateTag } from 'next/cache';

export type CohortResource = 'sprints' | 'students' | 'reviews' | 'inquiries' | 'participants';

export function cohortCacheTag(cohortId: string, resource: CohortResource) {
  if (!cohortId) throw new Error('cohortId is required for cohort cache tags');
  return `cohort:${cohortId}:${resource}`;
}

export function cohortCacheKey(cohortId: string, resource: CohortResource, userId: string) {
  return ['cohort-data', cohortId, resource, userId] as const;
}

export function revalidateCohort(cohortId: string, ...resources: CohortResource[]) {
  for (const resource of resources) revalidateTag(cohortCacheTag(cohortId, resource), 'max');
}
