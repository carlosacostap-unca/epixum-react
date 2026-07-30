import ReviewsCohortView from '@/components/cohorts/ReviewsCohortView';

export const dynamic = 'force-dynamic';

export default async function ReviewsPage({ params }: { params: Promise<{ cohortId: string }> }) {
  const { cohortId } = await params;
  return <ReviewsCohortView cohortId={cohortId} />;
}
