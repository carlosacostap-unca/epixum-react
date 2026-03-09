"use client";

import { useState } from 'react';
import { User, Sprint, Review } from '@/types';
import { upsertReviewNotes } from '@/lib/actions-reviews';
import { useRouter } from 'next/navigation';
import FormattedDate from "@/components/FormattedDate";

interface StudentsTableProps {
  students: User[];
  sprints: Sprint[];
  reviews: Review[];
}

export default function StudentsTable({ students, sprints, reviews }: StudentsTableProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null);
  const [privateNote, setPrivateNote] = useState('');
  const [publicNote, setPublicNote] = useState('');
  const [status, setStatus] = useState<'Aprobado' | 'Pendiente' | 'No presentó' | 'Desaprobado'>('Pendiente');
  const [reviewId, setReviewId] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  const getReview = (studentId: string, sprintId: string) => {
    return reviews.find(r => r.student === studentId && r.sprint === sprintId);
  };

  const openModal = (student: User, sprint: Sprint) => {
    const review = getReview(student.id, sprint.id);
    setSelectedStudent(student);
    setSelectedSprint(sprint);
    setPrivateNote(review?.private_note || '');
    setPublicNote(review?.public_note || '');
    setStatus(review?.status || 'Pendiente');
    setReviewId(review?.id);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!selectedStudent || !selectedSprint) return;

    setIsSaving(true);
    const result = await upsertReviewNotes(
      selectedSprint.id,
      selectedStudent.id,
      privateNote,
      publicNote,
      status,
      reviewId
    );

    setIsSaving(false);
    if (result.success) {
      setIsModalOpen(false);
      router.refresh();
    } else {
      alert(result.error || 'Error al guardar');
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 shadow-sm rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
              <th className="p-4 font-semibold text-zinc-900 dark:text-zinc-100 sticky left-0 bg-zinc-50 dark:bg-zinc-800 z-10">Estudiante</th>
              {sprints.map(sprint => (
                <th key={sprint.id} className="p-4 font-semibold text-zinc-900 dark:text-zinc-100 min-w-[150px]">
                  {sprint.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map(student => (
              <tr key={student.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <td className="p-4 sticky left-0 bg-white dark:bg-zinc-900 z-10 border-r border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-sm">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">{student.name}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">{student.email}</div>
                    </div>
                  </div>
                </td>
                {sprints.map(sprint => {
                  const review = getReview(student.id, sprint.id);
                  const status = review?.status || 'Pendiente';
                  
                  let statusColor = 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400';
                  if (status === 'Aprobado') statusColor = 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
                  if (status === 'No presentó') statusColor = 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
                  if (status === 'Desaprobado') statusColor = 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300';
                  if (status === 'Pendiente' && review) statusColor = 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';

                  return (
                    <td key={sprint.id} className="p-4">
                      <button
                        onClick={() => openModal(student, sprint)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 ${statusColor}`}
                      >
                        <div className="flex flex-col">
                          <span className="font-bold">{status}</span>
                          {review && (review.private_note || review.public_note) && (
                            <span className="text-[10px] opacity-70 mt-1 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              Con notas
                            </span>
                          )}
                        </div>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && selectedStudent && selectedSprint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                  Notas: {selectedSprint.title}
                </h3>
                <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                  Estudiante: {selectedStudent.name}
                </p>
                {getReview(selectedStudent.id, selectedSprint.id)?.startTime ? (
                   <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-2 flex items-center gap-2">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                     Turno reservado: <FormattedDate date={getReview(selectedStudent.id, selectedSprint.id)!.startTime} showTime={true} />
                   </p>
                ) : (
                   <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 flex items-center gap-2">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     Sin turno reservado
                   </p>
                )}
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Estado del Sprint
                </label>
                <div className="flex gap-2 flex-wrap">
                  {(['Pendiente', 'Aprobado', 'No presentó', 'Desaprobado'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border-2 ${
                        status === s
                          ? s === 'Aprobado' 
                            ? 'bg-green-100 text-green-700 border-green-500 dark:bg-green-900/50 dark:text-green-300' 
                            : s === 'No presentó'
                              ? 'bg-red-100 text-red-700 border-red-500 dark:bg-red-900/50 dark:text-red-300'
                              : s === 'Desaprobado'
                                ? 'bg-orange-100 text-orange-700 border-orange-500 dark:bg-orange-900/50 dark:text-orange-300'
                                : 'bg-yellow-100 text-yellow-700 border-yellow-500 dark:bg-yellow-900/50 dark:text-yellow-300'
                          : 'bg-zinc-100 text-zinc-600 border-transparent hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Nota Privada (Solo visible para docentes)
                </label>
                <textarea
                  value={privateNote}
                  onChange={(e) => setPrivateNote(e.target.value)}
                  className="w-full h-32 px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all"
                  placeholder="Escribe tus observaciones privadas aquí..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Nota Pública (Visible para el estudiante)
                </label>
                <textarea
                  value={publicNote}
                  onChange={(e) => setPublicNote(e.target.value)}
                  className="w-full h-32 px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all"
                  placeholder="Feedback para el estudiante..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-medium"
                disabled={isSaving}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-sm shadow-purple-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Cambios'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
