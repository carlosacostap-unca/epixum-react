import CohortSettings from '@/components/cohorts/CohortSettings';
import ParticipantAdmin from '@/components/cohorts/ParticipantAdmin';
import { resolveCohortContext } from '@/lib/cohort-context';
import { getCohortParticipants, getCourses, getParticipantCandidates } from '@/lib/data-cohorts';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ManageCohortPage({ params }: { params: Promise<{ cohortId: string }> }) {
  const { cohortId } = await params;
  const context = await resolveCohortContext(cohortId);
  if (context.user.role !== 'admin' && context.user.role !== 'docente') redirect(`/cohorts/${cohortId}/sprints`);
  const [courses, participants, candidates] = await Promise.all([
    getCourses(),
    getCohortParticipants(cohortId),
    context.permissions.has('manage-students') ? getParticipantCandidates(cohortId) : Promise.resolve([]),
  ]);
  return <main className="container mx-auto space-y-8 p-8"><div><p className="text-sm text-zinc-500">Gestión de cohorte</p><h1 className="text-3xl font-bold">{context.cohort.name}</h1></div><CohortSettings cohort={context.cohort} courses={courses} isAdmin={context.isAdmin} /><ParticipantAdmin cohortId={cohortId} participants={participants} candidates={candidates} canManage={context.permissions.has('manage-students')} isAdmin={context.isAdmin} readOnly={context.cohort.status === 'archived'} /></main>;
}
