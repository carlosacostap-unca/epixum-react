import { getStudents, getSprints, getReviews } from '@/lib/data';
import { createServerClient } from '@/lib/pocketbase-server';
import { redirect } from 'next/navigation';
import StudentsTable from './StudentsTable';
import { Review } from '@/types';

export const metadata = {
  title: 'Estudiantes | Epixum - React',
};

export default async function StudentsPage() {
  const pb = await createServerClient();
  const user = pb.authStore.model;

  if (!user || (user.role !== 'docente' && user.role !== 'admin')) {
    redirect('/');
  }

  const [students, sprints] = await Promise.all([
    getStudents(),
    getSprints(),
  ]);

  // Fetch reviews for all sprints in parallel
  const reviewsPromises = sprints.map(sprint => getReviews(sprint.id));
  const reviewsArrays = await Promise.all(reviewsPromises);
  
  // Flatten reviews array
  const allReviews = reviewsArrays.flat();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
            Gestión de Estudiantes
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Visualiza y gestiona las notas de los estudiantes por sprint.
          </p>
        </div>
      </div>

      <StudentsTable 
        students={students} 
        sprints={sprints} 
        reviews={allReviews} 
      />
    </div>
  );
}
