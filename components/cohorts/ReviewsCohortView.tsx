import Link from 'next/link';
import FormattedDate from '@/components/FormattedDate';
import { resolveCohortContext } from '@/lib/cohort-context';
import { getSprints, getUserReviews } from '@/lib/data';
import type { Review } from '@/types';

export default async function ReviewsCohortView({ cohortId }: { cohortId: string }) {
  const { user } = await resolveCohortContext(cohortId);
  const sprints = await getSprints(cohortId);
  let reviews: Review[] = [];
  if (user.role === 'estudiante') {
    try { reviews = await getUserReviews(cohortId, user.id); } catch (error) { console.error('Error fetching reviews', error); }
  }
  const reviewsMap = new Map(reviews.map((review) => [review.sprint, review]));

  return (
    <main className="container mx-auto min-h-screen p-8">
      <div className="mb-8 flex items-center gap-4"><Link href="/" className="rounded-lg p-2 text-zinc-500" aria-label="Volver al inicio">←</Link><div><h1 className="text-3xl font-bold">Revisiones</h1><p className="mt-2 text-zinc-500">Seleccioná un Sprint para ver o gestionar los turnos de revisión.</p></div></div>
      {sprints.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white py-12 text-center dark:border-zinc-800 dark:bg-zinc-900"><h2 className="text-lg font-bold">No hay sprints disponibles</h2><p className="mt-2 text-zinc-500">Es necesario crear Sprints antes de gestionar revisiones.</p></div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sprints.map((sprint) => {
            const status = reviewsMap.get(sprint.id)?.status || 'Pendiente';
            return (
              <Link href={`/reviews/${sprint.id}`} key={sprint.id} className="group block rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-purple-500 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-4 flex items-center justify-between"><div className="flex gap-2"><span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-600">Sprint</span>{user.role === 'estudiante' && <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold">{status}</span>}</div>{(sprint.startDate || sprint.endDate) && <span className="flex gap-1 text-xs text-zinc-500">{sprint.startDate && <FormattedDate date={sprint.startDate} />}{sprint.startDate && sprint.endDate && ' - '}{sprint.endDate && <FormattedDate date={sprint.endDate} />}</span>}</div>
                <h2 className="mb-2 text-2xl font-bold group-hover:text-purple-600">{sprint.title}</h2><p className="line-clamp-3 text-zinc-600 dark:text-zinc-400">{sprint.description}</p>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
