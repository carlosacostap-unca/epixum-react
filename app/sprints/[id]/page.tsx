import { getSprint, getClasses, getAssignments, getUserReview } from "@/lib/data";
import { Sprint, Class, Assignment } from "@/types";
import Link from "next/link";
import { notFound } from "next/navigation";
import FormattedDate from "@/components/FormattedDate";
import { getCurrentUser } from "@/lib/pocketbase-server";
import SprintDetailsManagement from "@/components/SprintDetailsManagement";

export const dynamic = 'force-dynamic';

export default async function SprintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let sprint: Sprint | null = null;
  let classes: Class[] = [];
  let assignments: Assignment[] = [];
  const user = await getCurrentUser();
  let review = null;
  
  try {
    sprint = await getSprint(id);
    if (!sprint) {
      notFound();
    }
    classes = await getClasses(id);
    assignments = await getAssignments(id);
    if (user && user.role === 'estudiante') {
      review = await getUserReview(id, user.id);
    }
  } catch (error) {
    console.error("Error fetching sprint details:", error);
    notFound();
  }

  const isAuthorized = user && (user.role === 'docente' || user.role === 'admin');
  
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
    <div className="container mx-auto p-8 min-h-screen">
      <Link href="/sprints" className="text-blue-500 hover:underline mb-8 inline-block">&larr; Volver a sprints</Link>
      
      <header className="mb-12">
        <div className="flex items-center gap-4 mb-2">
            <span className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-200">
                Sprint
            </span>
            {user?.role === 'estudiante' && (
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColor}`}>
                  {status}
              </span>
            )}
            {(sprint.startDate || sprint.endDate) && (
              <span className="text-sm text-zinc-500 dark:text-zinc-400 flex gap-1">
                {sprint.startDate && <FormattedDate date={sprint.startDate} />} 
                {sprint.startDate && sprint.endDate && " - "}
                {sprint.endDate && <FormattedDate date={sprint.endDate} />}
              </span>
            )}
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">
          {sprint.title}
        </h1>
        <p className="text-xl text-zinc-500 dark:text-zinc-400 max-w-3xl">
          {sprint.description}
        </p>
      </header>

      {isAuthorized ? (
        <SprintDetailsManagement 
          user={user} 
          sprintId={sprint.id} 
          classes={classes} 
          assignments={assignments} 
        />
      ) : (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold mb-6">Clases del Sprint</h2>
          {classes.length === 0 ? (
               <p className="text-zinc-500">No hay clases en este sprint todavía.</p>
          ) : (
              classes.map((clase, index) => (
              <Link 
                  href={`/classes/${clase.id}`} 
                  key={clase.id}
                  className="flex items-center p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors group"
              >
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-bold group-hover:bg-blue-100 group-hover:text-blue-600 dark:group-hover:bg-blue-900 dark:group-hover:text-blue-200 transition-colors">
                      {index + 1}
                  </div>
                  <div className="ml-4">
                      <h3 className="text-lg font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {clase.title}
                      </h3>
                      {clase.date && (
                          <p className="text-xs text-zinc-400 mb-1">
                              <FormattedDate date={clase.date} showTime={true} />
                          </p>
                      )}
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          {clase.description}
                      </p>
                  </div>
                  <div className="ml-auto text-zinc-400 group-hover:text-blue-500">
                      &rarr;
                  </div>
              </Link>
              ))
          )}
  
          {/* Assignments Section */}
          <h2 className="text-2xl font-semibold mb-6 mt-12 flex items-center gap-2">
              <span className="p-1 bg-purple-100 dark:bg-purple-900 rounded-md">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              </span>
              Trabajos Prácticos
          </h2>
          {assignments.length > 0 ? (
              <div className="grid gap-4">
                  {assignments.map((tp, index) => (
                      <Link 
                          key={tp.id} 
                          href={`/assignments/${tp.id}`}
                          className="group block p-6 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-purple-500 dark:hover:border-purple-500 transition-all hover:shadow-md"
                      >
                          <div className="flex items-center">
                              <div className="flex-shrink-0 w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold mr-4">
                                  {index + 1}
                              </div>
                              <div className="flex-grow">
                                  <h3 className="text-lg font-semibold group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                    {tp.title}
                                </h3>
                                <div 
                                    className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 prose prose-sm dark:prose-invert max-w-none [&>p]:my-0 [&>ul]:my-0 [&>ol]:my-0"
                                    dangerouslySetInnerHTML={{ __html: tp.description }}
                                />
                            </div>
                              <div className="ml-4 text-zinc-400 group-hover:text-purple-500">
                                  &rarr;
                              </div>
                          </div>
                      </Link>
                  ))}
              </div>
          ) : (
              <p className="text-zinc-500 italic">No hay trabajos prácticos en este sprint.</p>
          )}
        </div>
      )}
    </div>
  );
}
