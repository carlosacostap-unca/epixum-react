'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Cohort, Course, LifecycleStatus } from '@/types';
import { setCohortStatus, updateCohort } from '@/lib/actions-cohorts';

export default function CohortSettings({ cohort, courses, isAdmin }: { cohort: Cohort; courses: Course[]; isAdmin: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const archived = cohort.status === 'archived';
  const run = (operation: () => ReturnType<typeof setCohortStatus>) => { setError(null); startTransition(async () => { const result = await operation(); if (!result.success) setError(result.error); else router.refresh(); }); };
  const changeStatus = (status: LifecycleStatus) => run(() => setCohortStatus(cohort.id, status));

  return (
    <div className="space-y-4">
      {archived && <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"><strong>Cohorte archivada.</strong> Su historial permanece disponible en modo de solo lectura.</div>}
      <form onSubmit={(event) => { event.preventDefault(); run(() => updateCohort(cohort.id, new FormData(event.currentTarget))); }} className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 md:grid-cols-2">
        <label className="text-sm font-medium">Curso<select name="course" defaultValue={cohort.course} disabled={archived} className="mt-1 w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 disabled:opacity-60 dark:border-zinc-700">{courses.filter((course) => course.status === 'active' || course.id === cohort.course).map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</select></label>
        <label className="text-sm font-medium">Nombre<input name="name" defaultValue={cohort.name} required disabled={archived} className="mt-1 w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 disabled:opacity-60 dark:border-zinc-700" /></label>
        <label className="text-sm font-medium">Fecha inicial<input name="startDate" type="date" defaultValue={cohort.startDate.slice(0, 10)} required disabled={archived} className="mt-1 w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 disabled:opacity-60 dark:border-zinc-700" /></label>
        <label className="text-sm font-medium">Fecha final<input name="endDate" type="date" defaultValue={cohort.endDate.slice(0, 10)} required disabled={archived} className="mt-1 w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 disabled:opacity-60 dark:border-zinc-700" /></label>
        {error && <p role="alert" className="text-sm text-red-600 md:col-span-2">{error}</p>}
        <div className="flex flex-wrap gap-3 md:col-span-2">
          {!archived && <button disabled={pending} className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50">Guardar cambios</button>}
          {cohort.status === 'planned' && <button type="button" disabled={pending} onClick={() => changeStatus('active')} className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white">Activar</button>}
          {!archived && <button type="button" disabled={pending} onClick={() => changeStatus('archived')} className="rounded-lg border border-red-300 px-4 py-2 font-medium text-red-600">Archivar</button>}
          {archived && isAdmin && <button type="button" disabled={pending} onClick={() => changeStatus('planned')} className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white">Reactivar como planificada</button>}
        </div>
      </form>
    </div>
  );
}
