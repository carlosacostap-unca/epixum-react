import NoCohortState from '@/components/cohorts/NoCohortState';
import { canonicalCohortPath } from '@/lib/cohort-navigation';
import { getDefaultAccessibleCohort } from '@/lib/data-cohorts';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function LegacySprintsPage() {
  const cohort = await getDefaultAccessibleCohort();
  if (cohort) redirect(canonicalCohortPath(cohort.id, 'sprints'));
  return <NoCohortState />;
}
