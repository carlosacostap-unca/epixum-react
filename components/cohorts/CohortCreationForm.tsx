'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Course } from '@/types';
import { createCohort } from '@/lib/actions-cohorts';

export default function CohortCreationForm({ courses }: { courses: Course[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const activeCourses = courses.filter((course) => course.status === 'active');

  if (activeCourses.length === 0) return <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-800">No hay cursos activos disponibles para crear una cohorte.</p>;

  return (
    <form onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; setError(null); startTransition(async () => { const result = await createCohort(new FormData(form)); if (!result.success) setError(result.error); else { form.reset(); router.refresh(); } }); }} className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 md:grid-cols-2">
      <div className="md:col-span-2"><h2 className="text-xl font-bold">Nueva cohorte</h2><p className="text-sm text-zinc-500">Se creará inicialmente como planificada.</p></div>
      <label className="text-sm font-medium">Curso<select name="course" required className="mt-1 w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700">{activeCourses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</select></label>
      <label className="text-sm font-medium">Nombre<input name="name" required maxLength={200} className="mt-1 w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700" /></label>
      <label className="text-sm font-medium">Fecha inicial<input name="startDate" type="date" required className="mt-1 w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700" /></label>
      <label className="text-sm font-medium">Fecha final<input name="endDate" type="date" required className="mt-1 w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700" /></label>
      {error && <p role="alert" className="text-sm text-red-600 md:col-span-2">{error}</p>}
      <button disabled={pending} className="w-fit rounded-lg bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50">{pending ? 'Creando…' : 'Crear cohorte'}</button>
    </form>
  );
}
