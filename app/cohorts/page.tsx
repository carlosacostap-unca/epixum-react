import Link from 'next/link';
import CohortCreationForm from '@/components/cohorts/CohortCreationForm';
import { getAccessibleCohorts, getCourses } from '@/lib/data-cohorts';
import { getCurrentUser } from '@/lib/pocketbase-server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

const statusLabel = { planned: 'Planificada', active: 'Activa', archived: 'Archivada' } as const;

export default async function CohortsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const [cohorts, courses] = await Promise.all([getAccessibleCohorts(), getCourses()]);
  const canCreate = user.role === 'admin' || user.role === 'docente';
  return (
    <main className="container mx-auto space-y-8 p-8">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-3xl font-bold">Cohortes</h1><p className="mt-2 text-zinc-500">Cada cohorte mantiene participantes y actividad académica independientes.</p></div>{user.role === 'admin' && <Link href="/admin/courses" className="text-sm font-medium text-blue-600">Administrar cursos</Link>}</div>
      {canCreate && <CohortCreationForm courses={courses} />}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cohorts.map((cohort) => <article key={cohort.id} className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"><div className="flex items-start justify-between gap-3"><div><p className="text-sm text-zinc-500">{cohort.expand?.course?.name ?? 'Curso'}</p><h2 className="text-xl font-bold">{cohort.name}</h2></div><span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium dark:bg-zinc-800">{statusLabel[cohort.status]}</span></div><p className="mt-4 text-sm text-zinc-500">{cohort.startDate.slice(0, 10)} — {cohort.endDate.slice(0, 10)}</p><div className="mt-5 flex gap-4"><Link href={`/cohorts/${cohort.id}/sprints`} className="text-sm font-medium text-blue-600">Abrir</Link>{(user.role === 'admin' || user.role === 'docente') && <Link href={`/cohorts/${cohort.id}/manage`} className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Gestionar</Link>}</div></article>)}
      </div>
      {cohorts.length === 0 && <p className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center text-zinc-500">No tenés cohortes accesibles.</p>}
    </main>
  );
}
