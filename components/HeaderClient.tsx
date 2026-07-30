'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { User } from '@/types';
import pb from '@/lib/pocketbase';
import {
  canonicalCohortPath,
  ACTIVE_COHORT_COOKIE,
  cohortIdFromPath,
  equivalentCohortDestination,
  type CohortSection,
} from '@/lib/cohort-navigation';

type HeaderCohort = { id: string; name: string; status: string };

export default function HeaderClient({
  initialUser,
  cohorts,
  initialActiveCohortId,
}: {
  initialUser: User | null;
  cohorts: HeaderCohort[];
  initialActiveCohortId: string | null;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(initialUser);
  const [pendingCohortId, setPendingCohortId] = useState<string | null>(null);
  const routeCohortId = cohortIdFromPath(pathname);
  const isSwitching = pendingCohortId !== null && routeCohortId !== pendingCohortId;
  const selectedCohortId = useMemo(() => {
    if (routeCohortId && cohorts.some((cohort) => cohort.id === routeCohortId)) {
      return routeCohortId;
    }
    return initialActiveCohortId;
  }, [cohorts, initialActiveCohortId, routeCohortId]);

  useEffect(() => {
    pb.authStore.loadFromCookie(document.cookie);
    const refreshUser = async () => {
      if (pb.authStore.isValid && pb.authStore.model) {
        try {
          const updatedUser = await pb.collection('users').getOne(pb.authStore.model.id);
          pb.authStore.save(pb.authStore.token, updatedUser);
          document.cookie = pb.authStore.exportToCookie({ httpOnly: false });
          setUser(updatedUser as unknown as User);
        } catch (error) {
          console.error('Failed to refresh user data', error);
          setUser(pb.authStore.model as unknown as User);
        }
      } else {
        setUser(null);
      }
    };

    void refreshUser();
    return pb.authStore.onChange((_token, model) => setUser(model as unknown as User));
  }, []);

  if (pathname === '/login') return null;

  const handleLogout = () => {
    pb.authStore.clear();
    document.cookie = 'pb_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = `${ACTIVE_COHORT_COOKIE}=; max-age=0; path=/; SameSite=Lax`;
    router.push('/login');
    router.refresh();
  };

  const handleCohortChange = (cohortId: string) => {
    if (!cohorts.some((cohort) => cohort.id === cohortId) || cohortId === selectedCohortId) return;
    setPendingCohortId(cohortId);
    document.cookie = `${ACTIVE_COHORT_COOKIE}=${encodeURIComponent(cohortId)}; max-age=31536000; path=/; SameSite=Lax`;
    const query = searchParams.toString();
    const destination = equivalentCohortDestination(pathname, cohortId);
    router.push(query ? `${destination}?${query}` : destination);
  };

  const cohortHref = (section: CohortSection) => selectedCohortId
    ? canonicalCohortPath(selectedCohortId, section)
    : '/';

  return (
    <header className="mb-6 border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-zinc-900 transition-opacity hover:opacity-80 dark:text-zinc-100">
          <Image src="/epixum-logo.png" alt="Epixum Logo" width={32} height={32} className="h-8 w-8 object-contain" />
          <span>Epixum - React</span>
        </Link>

        {user && (
          <div className="flex flex-wrap items-center justify-end gap-3">
            {cohorts.length === 0 ? (
              <span className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                Sin cohorte disponible
              </span>
            ) : cohorts.length === 1 ? (
              <span className="rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                {cohorts[0].name}
              </span>
            ) : (
              <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                <span className="sr-only">Cohorte activa</span>
                <select
                  aria-label="Cohorte activa"
                  value={selectedCohortId ?? ''}
                  disabled={isSwitching}
                  onChange={(event) => handleCohortChange(event.target.value)}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 font-medium text-zinc-800 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  {cohorts.map((cohort) => <option key={cohort.id} value={cohort.id}>{cohort.name}</option>)}
                </select>
                {isSwitching && <span aria-live="polite">Cambiando…</span>}
              </label>
            )}

            {selectedCohortId && (
              <nav aria-label="Navegación de la cohorte" className="flex items-center gap-3 text-sm font-medium">
                <Link href={cohortHref('sprints')}>Sprints</Link>
                <Link href={cohortHref('reviews')}>Revisiones</Link>
                {(user.role === 'docente' || user.role === 'admin') && <Link href={cohortHref('students')}>Estudiantes</Link>}
                <Link href={cohortHref('inquiries')}>Consultas</Link>
              </nav>
            )}

            {user.role === 'admin' && <Link href="/admin/users" className="text-sm font-medium text-zinc-600 hover:text-blue-500 dark:text-zinc-400">Administrar Usuarios</Link>}
            {(user.role === 'admin' || user.role === 'docente') && <Link href="/cohorts" className="text-sm font-medium text-zinc-600 hover:text-blue-500 dark:text-zinc-400">Cohortes</Link>}
            {user.role === 'admin' && <Link href="/admin/courses" className="text-sm font-medium text-zinc-600 hover:text-blue-500 dark:text-zinc-400">Cursos</Link>}
            <Link href="/profile" className="flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700">
              {user.avatar && (
                // PocketBase serves user-configured hosts, so this avatar intentionally bypasses Next image optimization.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/_pb_users_auth_/${user.id}/${user.avatar}`} className="h-5 w-5 rounded-full object-cover" alt="" />
              )}
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{user.name}</span>
            </Link>
            <button onClick={handleLogout} className="text-sm text-zinc-600 hover:text-red-500 dark:text-zinc-400">Cerrar Sesión</button>
          </div>
        )}
      </div>
    </header>
  );
}
