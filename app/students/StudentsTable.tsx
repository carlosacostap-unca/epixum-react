"use client";

import { useState } from 'react';
import { User, Sprint, Review } from '@/types';
import { upsertReviewNotes } from '@/lib/actions-reviews';
import { useRouter } from 'next/navigation';

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
                  const hasNotes = review && (review.private_note || review.public_note);
                  
                  return (
                    <td key={sprint.id} className="p-4">
                      <button
                        onClick={() => openModal(student, sprint)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          hasNotes 
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                        }`}
                      >
                        {hasNotes ? 'Ver notas' : 'Añadir nota'}
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
