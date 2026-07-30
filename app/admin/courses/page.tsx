import CourseAdmin from '@/components/admin/CourseAdmin';
import { getCourses } from '@/lib/data-cohorts';
import { getCurrentUser } from '@/lib/pocketbase-server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function CoursesAdminPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') redirect('/');
  const courses = await getCourses();
  return <main className="container mx-auto space-y-8 p-8"><div><h1 className="text-3xl font-bold">Administración de cursos</h1><p className="mt-2 text-zinc-500">Gestioná las definiciones reutilizables, separadas de sus cohortes y períodos.</p></div><CourseAdmin courses={courses} /></main>;
}
