import InquiriesCohortView from '@/components/cohorts/InquiriesCohortView';

export const dynamic = 'force-dynamic';

export default async function InquiriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ cohortId: string }>;
  searchParams: Promise<{ search?: string | string[] }>;
}) {
  const [{ cohortId }, query] = await Promise.all([params, searchParams]);
  return <InquiriesCohortView cohortId={cohortId} search={typeof query.search === 'string' ? query.search : undefined} />;
}
