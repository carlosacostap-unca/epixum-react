import { getSprints, getUserReviews } from "@/lib/data";
import { Sprint, Review } from "@/types";
import Link from "next/link";
import FormattedDate from "@/components/FormattedDate";
import { getCurrentUser } from "@/lib/pocketbase-server";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function ReviewsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const sprints = await getSprints();
  let reviews: Review[] = [];

  if (user.role === 'estudiante') {
      try {
          reviews = await getUserReviews(user.id);
      } catch (e) {
          console.error("Error fetching reviews:", e);
      }
  }

  const reviewsMap = new Map(reviews.map(r => [r.sprint, r]));
  const isStudent = user.role === 'estudiante';

  return (
    <div className="container mx-auto p-8 min-h-screen">
      <div className="mb-8 flex items-center gap-4">
        <Link 
            href="/"
            className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </Link>
        <div>
            <h1 className="text-3xl font-bold">Revisiones</h1>
            <p className="text-zinc-500 mt-2">Selecciona un Sprint para ver o gestionar los turnos de revisión.</p>
        </div>
      </div>

      {sprints.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">No hay sprints disponibles</h3>
          <p className="text-zinc-500 dark:text-zinc-400">Es necesario crear Sprints antes de gestionar revisiones.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sprints.map((sprint) => {
            const review = reviewsMap.get(sprint.id);
            const status = review?.status || 'Pendiente';
            let statusColor = "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300";
            
            if (status === 'Aprobado') {
                statusColor = "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300";
            } else if (status === 'No presentó') {
                statusColor = "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300";
            } else if (status === 'Desaprobado') {
                statusColor = "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300";
            }

            return (
            <Link 
              href={`/reviews/${sprint.id}`} 
              key={sprint.id} 
              className="group block p-6 bg-white dark:bg-zinc-900 rounded-xl shadow-sm hover:shadow-md transition-all border border-zinc-200 dark:border-zinc-800 hover:border-purple-500 dark:hover:border-purple-500"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                    <span className="px-3 py-1 text-xs font-medium text-purple-600 bg-purple-100 rounded-full dark:bg-purple-900 dark:text-purple-200">
                    Sprint
                    </span>
                    {isStudent && (
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColor}`}>
                            {status}
                        </span>
                    )}
                </div>
                {(sprint.startDate || sprint.endDate) && (
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 flex gap-1">
                    {sprint.startDate && <FormattedDate date={sprint.startDate} />} 
                    {sprint.startDate && sprint.endDate && " - "}
                    {sprint.endDate && <FormattedDate date={sprint.endDate} />}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {sprint.title}
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 line-clamp-3 mb-4">
                {sprint.description}
              </p>
              <div className="flex items-center text-sm font-medium text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform">
                Ver revisiones
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
            </Link>
          )})}
        </div>
      )}
    </div>
  );
}
