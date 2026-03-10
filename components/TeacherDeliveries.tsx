"use client";

import { Delivery } from "@/types";
import { useState } from "react";

interface TeacherDeliveriesProps {
  deliveries: Delivery[];
  assignmentId: string;
}

export default function TeacherDeliveries({ deliveries, assignmentId }: TeacherDeliveriesProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL?.replace(/\/$/, "") || "";

  const filteredDeliveries = deliveries.filter(delivery => {
    const student = delivery.expand?.student;
    const studentName = student?.name || "Estudiante desconocido";
    const studentEmail = student?.email || "Sin email";
    
    return studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           studentEmail.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span className="p-1 bg-blue-100 dark:bg-blue-900 rounded-md">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </span>
        Entregas ({deliveries.length})
      </h2>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar estudiante..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
          <thead className="bg-zinc-50 dark:bg-zinc-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-300 uppercase tracking-wider">
                Estudiante
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-300 uppercase tracking-wider">
                Repositorio
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-300 uppercase tracking-wider">
                Fecha
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-700">
            {filteredDeliveries.length > 0 ? (
              filteredDeliveries.map((delivery) => {
                const student = delivery.expand?.student;
                const studentName = student?.name || "Estudiante desconocido";
                const studentEmail = student?.email || "Sin email";
                
                return (
                <tr key={delivery.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-600 flex items-center justify-center text-zinc-500 dark:text-zinc-300 overflow-hidden">
                         {student?.avatar ? (
                            <img 
                              src={`${pbUrl}/api/files/${student.collectionId}/${student.id}/${student.avatar}`} 
                              alt={studentName} 
                              className="h-full w-full object-cover" 
                            />
                         ) : (
                            <span className="font-bold text-xs">
                                {studentName.charAt(0) || "?"}
                            </span>
                         )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {studentName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(() => {
                        let urls: string[] = [];
                        try {
                            const parsed = JSON.parse(delivery.repositoryUrl);
                            if (Array.isArray(parsed)) urls = parsed;
                            else urls = [delivery.repositoryUrl];
                        } catch {
                            urls = [delivery.repositoryUrl];
                        }
                        
                        return (
                            <div className="flex flex-col gap-1">
                                {urls.map((url, idx) => (
                                    <a 
                                      key={idx}
                                      href={url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-sm text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 hover:underline flex items-center gap-1"
                                    >
                                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                                      Repositorio {urls.length > 1 ? idx + 1 : ''}
                                    </a>
                                ))}
                            </div>
                        );
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                    {new Date(delivery.created).toLocaleDateString()}
                  </td>
                </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  No hay entregas registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
