import SprintsCohortView from '@/components/cohorts/SprintsCohortView';

export const dynamic = 'force-dynamic';

export default async function SprintsPage({ params }: { params: Promise<{ cohortId: string }> }) {
  const { cohortId } = await params;
  return <SprintsCohortView cohortId={cohortId} />;
}
