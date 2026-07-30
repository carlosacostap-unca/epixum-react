import type { Cohort } from '@/types';

export const COHORT_SECTIONS = ['sprints', 'reviews', 'students', 'inquiries'] as const;
export const ACTIVE_COHORT_COOKIE = 'active_cohort';

export type CohortSection = (typeof COHORT_SECTIONS)[number];
export type NavigableCohort = Pick<Cohort, 'id' | 'status'>;

const COHORT_ROUTE = /^\/cohorts\/([^/]+)\/(sprints|reviews|students|inquiries)(?:\/|$)/;
const LEGACY_ROUTE = /^\/(sprints|reviews|students|inquiries)(?:\/|$)/;

export function isSelectableCohort(cohort: NavigableCohort) {
  return cohort.status !== 'archived';
}

export function selectableCohorts<T extends NavigableCohort>(cohorts: readonly T[]): T[] {
  return cohorts.filter(isSelectableCohort);
}

export function selectPreferredCohort<T extends NavigableCohort>(
  cohorts: readonly T[],
  rememberedCohortId?: string | null,
): T | null {
  const selectable = selectableCohorts(cohorts);
  return selectable.find((cohort) => cohort.id === rememberedCohortId)
    ?? selectable.find((cohort) => cohort.status === 'active')
    ?? selectable[0]
    ?? null;
}

export function cohortSectionFromPath(pathname: string): CohortSection | null {
  const match = pathname.match(COHORT_ROUTE) ?? pathname.match(LEGACY_ROUTE);
  return (match?.[2] ?? match?.[1] ?? null) as CohortSection | null;
}

export function cohortIdFromPath(pathname: string): string | null {
  return pathname.match(COHORT_ROUTE)?.[1] ?? null;
}

export function canonicalCohortPath(cohortId: string, section: CohortSection) {
  return `/cohorts/${encodeURIComponent(cohortId)}/${section}`;
}

export function equivalentCohortDestination(pathname: string, cohortId: string) {
  return canonicalCohortPath(cohortId, cohortSectionFromPath(pathname) ?? 'sprints');
}
