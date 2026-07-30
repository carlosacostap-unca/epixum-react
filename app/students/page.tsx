import NoCohortState from '@/components/cohorts/NoCohortState';
import { canonicalCohortPath } from '@/lib/cohort-navigation';
import { getDefaultAccessibleCohort } from '@/lib/data-cohorts';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Estudiantes | Epixum - React' };

export default async function LegacyStudentsPage() {
  const cohort = await getDefaultAccessibleCohort();
  if (cohort) redirect(canonicalCohortPath(cohort.id, 'students'));
  return <NoCohortState />;
}
