import NoCohortState from '@/components/cohorts/NoCohortState';
import { canonicalCohortPath } from '@/lib/cohort-navigation';
import { getDefaultAccessibleCohort } from '@/lib/data-cohorts';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function LegacyReviewsPage() {
  const cohort = await getDefaultAccessibleCohort();
  if (cohort) redirect(canonicalCohortPath(cohort.id, 'reviews'));
  return <NoCohortState />;
}
