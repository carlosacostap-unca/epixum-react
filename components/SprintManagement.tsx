"use client";

import { useState } from "react";
import { Sprint, User } from "@/types";
import SprintForm from "./SprintForm";
import { deleteSprint } from "@/lib/actions";
import { useRouter } from "next/navigation";

interface SprintManagementProps {
  user: User;
  sprints: Sprint[];
  cohortId: string;
}

export default function SprintManagement({ user, sprints, cohortId }: SprintManagementProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const router = useRouter();

  if (user.role !== "docente" && user.role !== "admin") {
    return null;
  }

  const handleDelete = async (sprintId: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este sprint?")) {
      await deleteSprint(sprintId);
      router.refresh();
    }
  };

  return (
    <>
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium shadow-sm flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Sprint
        </button>
      </div>

      {/* Modal for Creating */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <SprintForm cohortId={cohortId} onClose={() => setIsCreating(false)} />
        </div>
      )}

      {/* Modal for Editing */}
      {editingSprint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <SprintForm cohortId={cohortId} sprint={editingSprint} onClose={() => setEditingSprint(null)} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sprints.map((sprint) => (
          <div 
            key={sprint.id} 
            className="group relative bg-white dark:bg-zinc-900 rounded-xl shadow-sm hover:shadow-md transition-all border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 flex flex-col"
          >
            <div 
               className="p-6 flex-grow cursor-pointer"
               onClick={() => router.push(`/sprints/${sprint.id}`)}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-200">
                  Sprint
                </span>
                {(sprint.startDate || sprint.endDate) && (
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 flex gap-1">
                    {sprint.startDate && new Date(sprint.startDate).toLocaleDateString()} 
                    {sprint.startDate && sprint.endDate && " - "}
                    {sprint.endDate && new Date(sprint.endDate).toLocaleDateString()}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {sprint.title}
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 line-clamp-3">
                {sprint.description}
              </p>
            </div>
            
            {/* Actions Footer */}
            <div className="border-t border-zinc-100 dark:border-zinc-800 p-3 flex justify-end gap-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-b-xl">
               <button 
                 onClick={(e) => {
                   e.stopPropagation();
                   setEditingSprint(sprint);
                 }}
                 className="p-2 text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 transition-colors"
                 title="Editar"
               >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                 </svg>
               </button>
               <button 
                 onClick={(e) => {
                   e.stopPropagation();
                   handleDelete(sprint.id);
                 }}
                 className="p-2 text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 transition-colors"
                 title="Eliminar"
               >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                 </svg>
               </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
