import Link from 'next/link';
import FormattedDate from '@/components/FormattedDate';
import SprintManagement from '@/components/SprintManagement';
import { getSprints, getUserReviews } from '@/lib/data';
import { errorMessage } from '@/lib/errors';
import { resolveCohortContext } from '@/lib/cohort-context';
import type { Review, Sprint } from '@/types';

export default async function SprintsCohortView({ cohortId }: { cohortId: string }) {
  const context = await resolveCohortContext(cohortId);
  const { user } = context;
  const isTeacher = user.role === 'docente' || user.role === 'admin';
  const canManage = context.permissions.has('manage-academics');
  let sprints: Sprint[] = [];
  let reviews: Review[] = [];
  let error: string | null = null;

  try {
    sprints = await getSprints(cohortId);
    if (!isTeacher) reviews = await getUserReviews(cohortId, user.id);
  } catch (caught: unknown) {
    console.error('Error fetching cohort sprints', caught);
    error = `Error al conectar con la base de datos: ${errorMessage(caught, String(caught))}`;
  }

  const reviewsMap = new Map(reviews.map((review) => [review.sprint, review]));

  return (
    <main className="container mx-auto min-h-screen p-8">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/" className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label="Volver al inicio">←</Link>
        <h1 className="text-3xl font-bold">{isTeacher ? 'Gestionar Sprints' : 'Mis Sprints'}</h1>
      </div>
      {error && <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700" role="alert">{error}</div>}
      {sprints.length === 0 && !isTeacher && !error ? (
        <div className="py-10 text-center text-xl text-zinc-500">No hay sprints disponibles todavía.</div>
      ) : canManage ? (
        <SprintManagement user={user} sprints={sprints} cohortId={cohortId} />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sprints.map((sprint) => {
            const status = reviewsMap.get(sprint.id)?.status || 'Pendiente';
            const statusColor = status === 'Aprobado'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
              : status === 'No presentó'
                ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                : status === 'Desaprobado'
                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300'
                  : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300';
            return (
              <Link href={`/sprints/${sprint.id}`} key={sprint.id} className="group block rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex gap-2"><span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-600">Sprint</span>{!isTeacher && <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColor}`}>{status}</span>}</div>
                  {(sprint.startDate || sprint.endDate) && <span className="flex gap-1 text-xs text-zinc-500">{sprint.startDate && <FormattedDate date={sprint.startDate} />}{sprint.startDate && sprint.endDate && ' - '}{sprint.endDate && <FormattedDate date={sprint.endDate} />}</span>}
                </div>
                <h2 className="mb-2 text-2xl font-bold transition-colors group-hover:text-blue-600">{sprint.title}</h2>
                <p className="line-clamp-3 text-zinc-600 dark:text-zinc-400">{sprint.description}</p>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
