'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Course } from '@/types';
import { createCourse, setCourseStatus, updateCourse } from '@/lib/actions-cohorts';

export default function CourseAdmin({ courses }: { courses: Course[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (operation: () => ReturnType<typeof createCourse>, form?: HTMLFormElement) => {
    setError(null);
    startTransition(async () => {
      const result = await operation();
      if (!result.success) setError(result.error);
      else { form?.reset(); router.refresh(); }
    });
  };

  return (
    <div className="space-y-8">
      <form onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; run(() => createCourse(new FormData(form)), form); }} className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 md:grid-cols-2">
        <div className="md:col-span-2"><h2 className="text-xl font-bold">Nuevo curso</h2><p className="text-sm text-zinc-500">La definición del curso se reutiliza entre cohortes.</p></div>
        <label className="text-sm font-medium">Nombre<input name="name" required maxLength={200} className="mt-1 w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700" /></label>
        <label className="text-sm font-medium">Descripción<textarea name="description" maxLength={5000} className="mt-1 min-h-24 w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700" /></label>
        <button disabled={pending} className="w-fit rounded-lg bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50">Crear curso</button>
      </form>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
      <div className="space-y-4">
        {courses.map((course) => (
          <form key={course.id} onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; run(() => updateCourse(course.id, new FormData(form))); }} className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 md:grid-cols-[1fr_2fr_auto]">
            <input name="name" defaultValue={course.name} required maxLength={200} disabled={course.status === 'archived'} className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 font-semibold disabled:opacity-60 dark:border-zinc-700" />
            <textarea name="description" defaultValue={course.description} maxLength={5000} disabled={course.status === 'archived'} className="min-h-20 rounded-lg border border-zinc-300 bg-transparent px-3 py-2 disabled:opacity-60 dark:border-zinc-700" />
            <div className="flex flex-col items-end gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${course.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-zinc-200 text-zinc-600'}`}>{course.status === 'active' ? 'Activo' : 'Archivado'}</span>
              {course.status === 'active' ? <><button disabled={pending} className="text-sm font-medium text-blue-600">Guardar</button><button type="button" disabled={pending} onClick={() => run(() => setCourseStatus(course.id, 'archived'))} className="text-sm font-medium text-red-600">Archivar</button></> : <button type="button" disabled={pending} onClick={() => run(() => setCourseStatus(course.id, 'active'))} className="text-sm font-medium text-blue-600">Reactivar</button>}
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}
