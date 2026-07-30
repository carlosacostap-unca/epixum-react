'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Enrollment, User } from '@/types';
import { setEnrollmentStatus, upsertEnrollment } from '@/lib/actions-cohorts';

export default function ParticipantAdmin({
  cohortId,
  participants,
  candidates,
  canManage,
  isAdmin,
  readOnly,
}: {
  cohortId: string;
  participants: Enrollment[];
  candidates: User[];
  canManage: boolean;
  isAdmin: boolean;
  readOnly: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const eligibleCandidates = candidates.filter((user) => isAdmin || user.role === 'estudiante');

  const run = (operation: () => ReturnType<typeof setEnrollmentStatus>, form?: HTMLFormElement) => {
    setError(null);
    startTransition(async () => {
      const result = await operation();
      if (!result.success) setError(result.error);
      else { form?.reset(); router.refresh(); }
    });
  };

  return (
    <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div><h2 className="text-xl font-bold">Participantes de la cohorte</h2><p className="text-sm text-zinc-500">Las bajas desactivan el acceso sin eliminar entregas, consultas ni evaluaciones históricas.</p></div>
      {canManage && !readOnly && (
        <form onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); const userId = String(data.get('userId')); const user = eligibleCandidates.find((candidate) => candidate.id === userId); if (!user) return; run(() => upsertEnrollment(cohortId, user.id, user.role === 'docente' ? 'teacher' : 'student'), form); }} className="flex flex-wrap items-end gap-3 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
          <label className="min-w-64 flex-1 text-sm font-medium">Agregar o reactivar<select name="userId" required defaultValue="" className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"><option value="" disabled>Seleccionar usuario…</option>{eligibleCandidates.map((user) => <option key={user.id} value={user.id}>{user.name || user.email} — {user.role === 'docente' ? 'Docente' : 'Estudiante'}</option>)}</select></label>
          <button disabled={pending} className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50">Guardar inscripción</button>
        </form>
      )}
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs uppercase text-zinc-500 dark:border-zinc-700"><tr><th className="px-3 py-3">Usuario</th><th className="px-3 py-3">Rol de cohorte</th><th className="px-3 py-3">Estado</th><th className="px-3 py-3 text-right">Acción</th></tr></thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {participants.map((enrollment) => {
              const user = enrollment.expand?.user;
              const mayManageRow = canManage && !readOnly && (isAdmin || enrollment.role === 'student');
              return <tr key={enrollment.id}><td className="px-3 py-3"><div className="font-medium">{user?.name || 'Usuario'}</div><div className="text-xs text-zinc-500">{user?.email}</div></td><td className="px-3 py-3">{enrollment.role === 'teacher' ? 'Docente' : 'Estudiante'}</td><td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-xs font-medium ${enrollment.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-zinc-200 text-zinc-600'}`}>{enrollment.status === 'active' ? 'Activa' : 'Inactiva'}</span></td><td className="px-3 py-3 text-right">{mayManageRow && <button disabled={pending} onClick={() => run(() => setEnrollmentStatus(enrollment.id, enrollment.status === 'active' ? 'inactive' : 'active'))} className={enrollment.status === 'active' ? 'font-medium text-red-600' : 'font-medium text-blue-600'}>{enrollment.status === 'active' ? 'Desactivar' : 'Reactivar'}</button>}</td></tr>;
            })}
          </tbody>
        </table>
        {participants.length === 0 && <p className="py-8 text-center text-sm text-zinc-500">Todavía no hay participantes inscriptos.</p>}
      </div>
    </section>
  );
}
