import StudentsTable from '@/app/students/StudentsTable';
import ParticipantAdmin from '@/components/cohorts/ParticipantAdmin';
import { resolveCohortContext } from '@/lib/cohort-context';
import { getReviews, getSprints, getStudents } from '@/lib/data';
import { getCohortParticipants, getParticipantCandidates } from '@/lib/data-cohorts';
import { redirect } from 'next/navigation';

export default async function StudentsCohortView({ cohortId }: { cohortId: string }) {
  const context = await resolveCohortContext(cohortId);
  if (context.user.role !== 'docente' && context.user.role !== 'admin') redirect('/');
  const [students, sprints, participants, candidates] = await Promise.all([
    getStudents(cohortId),
    getSprints(cohortId),
    getCohortParticipants(cohortId),
    context.permissions.has('manage-students') ? getParticipantCandidates(cohortId) : Promise.resolve([]),
  ]);
  const allReviews = (await Promise.all(sprints.map((sprint) => getReviews(cohortId, sprint.id)))).flat();
  const readOnly = context.cohort.status === 'archived';

  return (
    <main className="container mx-auto space-y-8 px-4 py-8">
      <div><h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-white">Gestión de estudiantes</h1><p className="text-zinc-500 dark:text-zinc-400">Administrá inscripciones y evaluaciones dentro de esta cohorte.</p></div>
      <ParticipantAdmin cohortId={cohortId} participants={participants} candidates={candidates} canManage={context.permissions.has('manage-students')} isAdmin={context.isAdmin} readOnly={readOnly} />
      <StudentsTable students={students} sprints={sprints} reviews={allReviews} readOnly={readOnly} />
    </main>
  );
}
