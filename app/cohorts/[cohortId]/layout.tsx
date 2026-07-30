import CohortRouteBoundary from '@/components/CohortRouteBoundary';
import { resolveCohortContext } from '@/lib/cohort-context';
import { notFound } from 'next/navigation';

export default async function CohortLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ cohortId: string }>;
}) {
  const { cohortId } = await params;

  try {
    await resolveCohortContext(cohortId);
  } catch {
    notFound();
  }

  return <CohortRouteBoundary cohortId={cohortId}>{children}</CohortRouteBoundary>;
}
