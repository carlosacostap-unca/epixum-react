import NoCohortState from '@/components/cohorts/NoCohortState';
import { canonicalCohortPath } from '@/lib/cohort-navigation';
import { getDefaultAccessibleCohort } from '@/lib/data-cohorts';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function LegacyInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string | string[] }>;
}) {
  const [cohort, query] = await Promise.all([getDefaultAccessibleCohort(), searchParams]);
  if (cohort) {
    const destination = canonicalCohortPath(cohort.id, 'inquiries');
    redirect(typeof query.search === 'string' ? `${destination}?search=${encodeURIComponent(query.search)}` : destination);
  }
  return <NoCohortState />;
}
