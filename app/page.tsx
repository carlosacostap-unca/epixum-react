import { getSprints } from "@/lib/data";
import { Sprint } from "@/types";
import Link from "next/link";
import { getCurrentUser } from "@/lib/pocketbase-server";
import FormattedDate from "@/components/FormattedDate";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await getCurrentUser();

  // 1. Student View (Navigation Cards)
  if (user && user.role === 'estudiante') {
    return (
        <div className="container mx-auto p-8 min-h-screen">
            <header className="mb-12 text-center">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">
                Curso de React
                </h1>
                <p className="text-xl text-zinc-500 dark:text-zinc-400">
                Domina el frontend con React, paso a paso.
                </p>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-12">
                <Link href="/sprints" className="block p-8 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 hover:shadow-md transition-all group">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-2 text-zinc-900 dark:text-white">Mis Sprints</h2>
                    <p className="text-zinc-500 dark:text-zinc-400">Accede a tus tareas, entregas y progresos del curso.</p>
                </Link>
                
                <Link href="/reviews" className="block p-8 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 hover:border-green-500 hover:shadow-md transition-all group">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-2 text-zinc-900 dark:text-white">Revisiones</h2>
                    <p className="text-zinc-500 dark:text-zinc-400">Reserva turnos de revisión con tus docentes.</p>
                </Link>

                <Link href="/inquiries" className="block p-8 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 hover:border-orange-500 hover:shadow-md transition-all group">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-2 text-zinc-900 dark:text-white">Consultas</h2>
                    <p className="text-zinc-500 dark:text-zinc-400">Pregunta dudas y ayuda a tus compañeros.</p>
                </Link>
            </div>
        </div>
    );
  }

  // 2. Teacher / Admin View (Navigation Cards)
  if (user && (user.role === 'docente' || user.role === 'admin')) {
    return (
      <div className="container mx-auto p-8 min-h-screen">
          <header className="mb-12 text-center">
              <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">
              Panel Docente
              </h1>
              <p className="text-xl text-zinc-500 dark:text-zinc-400">
              Gestiona el curso y los sprints.
              </p>
          </header>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-12">
              <Link href="/sprints" className="block p-8 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 hover:shadow-md transition-all group">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  </div>
                  <h2 className="text-2xl font-bold mb-2 text-zinc-900 dark:text-white">Gestionar Sprints</h2>
                  <p className="text-zinc-500 dark:text-zinc-400">Crea, edita y administra los sprints y entregas del curso.</p>
              </Link>
              
              <Link href="/reviews" className="block p-8 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 hover:border-green-500 hover:shadow-md transition-all group">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <h2 className="text-2xl font-bold mb-2 text-zinc-900 dark:text-white">Revisiones</h2>
                  <p className="text-zinc-500 dark:text-zinc-400">Gestiona los turnos de revisión para los estudiantes.</p>
              </Link>

              <Link href="/students" className="block p-8 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 hover:border-purple-500 hover:shadow-md transition-all group">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                  </div>
                  <h2 className="text-2xl font-bold mb-2 text-zinc-900 dark:text-white">Estudiantes</h2>
                  <p className="text-zinc-500 dark:text-zinc-400">Listado de estudiantes y gestión de notas.</p>
              </Link>

              <Link href="/inquiries" className="block p-8 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 hover:border-orange-500 hover:shadow-md transition-all group">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <h2 className="text-2xl font-bold mb-2 text-zinc-900 dark:text-white">Consultas</h2>
                  <p className="text-zinc-500 dark:text-zinc-400">Responde dudas y gestiona las consultas del curso.</p>
              </Link>
          </div>
      </div>
    );
  }

  // 3. Guest View
  let sprints: Sprint[] = [];
  let error = null;

  try {
    sprints = await getSprints();
  } catch (e) {
    console.error("Error fetching sprints:", e);
    error = "No se pudieron cargar los sprints. Asegúrate de que la colección 'sprints' exista y sea pública.";
  }

  return (
    <div className="container mx-auto p-8 min-h-screen">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">
          Curso de React
        </h1>
        <p className="text-xl text-zinc-500 dark:text-zinc-400">
          Domina el frontend con React, paso a paso.
        </p>
      </header>

      {error ? (
        <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
          <span className="font-medium">Error:</span> {error}
        </div>
      ) : sprints.length === 0 ? (
        <div className="text-center py-10">
             <p className="text-xl text-zinc-500">No hay sprints disponibles todavía.</p>
        </div>
      ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sprints.map((sprint) => (
                  <Link 
                    href={`/sprints/${sprint.id}`} 
                    key={sprint.id} 
                    className="group block p-6 bg-white dark:bg-zinc-900 rounded-xl shadow-sm hover:shadow-md transition-all border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-200">
                        Sprint
                      </span>
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
                ))}
              </div>
      )}
    </div>
  );
}
