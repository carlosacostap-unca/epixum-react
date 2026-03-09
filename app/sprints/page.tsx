import { getSprints, getUserReviews } from "@/lib/data";
import { Sprint, Review } from "@/types";
import Link from "next/link";
import FormattedDate from "@/components/FormattedDate";
import { getCurrentUser } from "@/lib/pocketbase-server";
import { redirect } from "next/navigation";
import SprintManagement from "@/components/SprintManagement";

export const dynamic = 'force-dynamic';

export default async function SprintsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const isTeacher = user.role === 'docente' || user.role === 'admin';

  let sprints: Sprint[] = [];
  let reviews: Review[] = [];
  let error = null;

  try {
    sprints = await getSprints();
    if (!isTeacher) {
      reviews = await getUserReviews(user.id);
    }
  } catch (e: any) {
    console.error("Error fetching data:", e);
    error = `Error al conectar con la base de datos: ${e?.message || String(e)}`;
  }

  const reviewsMap = new Map(reviews.map(r => [r.sprint, r]));

  return (
    <div className="container mx-auto p-8 min-h-screen">
      <div className="mb-8 flex items-center gap-4">
        <Link 
            href="/"
            className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </Link>
        <h1 className="text-3xl font-bold">{isTeacher ? 'Gestionar Sprints' : 'Mis Sprints'}</h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {sprints.length === 0 && !isTeacher && !error ? (
        <div className="text-center py-10">
          <p className="text-xl text-zinc-500">No hay sprints disponibles todavía.</p>
        </div>
      ) : (
        isTeacher ? (
            <SprintManagement user={user} sprints={sprints} />
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
                href={`/sprints/${sprint.id}`} 
                key={sprint.id} 
                className="group block p-6 bg-white dark:bg-zinc-900 rounded-xl shadow-sm hover:shadow-md transition-all border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-2">
                        <span className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-200">
                        Sprint
                        </span>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusColor}`}>
                            {status}
                        </span>
                    </div>
                    {(sprint.startDate || sprint.endDate) && (
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 flex gap-1">
                        {sprint.startDate && <FormattedDate date={sprint.startDate} />} 
                        {sprint.startDate && sprint.endDate && " - "}
                        {sprint.endDate && <FormattedDate date={sprint.endDate} />}
                    </span>
                    )}
                </div>
                <h2 className="text-2xl font-bold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {sprint.title}
                </h2>
                <p className="text-zinc-600 dark:text-zinc-400 line-clamp-3">
                    {sprint.description}
                </p>
                </Link>
            )})}
            </div>
        )
      )}
    </div>
  );
}
