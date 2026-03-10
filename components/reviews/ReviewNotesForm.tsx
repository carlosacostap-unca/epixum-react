"use client";

import { useState, useTransition } from "react";
import { Review } from "@/types";
import { updateReviewNotes } from "@/lib/actions-reviews";
import { useRouter } from "next/navigation";

interface ReviewNotesFormProps {
  review: Review;
}

export default function ReviewNotesForm({ review }: ReviewNotesFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [privateNote, setPrivateNote] = useState(review.private_note || "");
  const [publicNote, setPublicNote] = useState(review.public_note || "");
  const [meetingLink, setMeetingLink] = useState(review.meetingLink || "");
  const [roomNumber, setRoomNumber] = useState(review.roomNumber || "");
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const res = await updateReviewNotes(review.id, privateNote, publicNote, meetingLink, roomNumber);
      
      if (res.success) {
        setMessage({ type: 'success', text: 'Información actualizada correctamente' });
        router.refresh();
      } else {
        setMessage({ type: 'error', text: res.error || 'Error al guardar' });
      }
    });
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
            <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            Detalles y Notas
        </h2>
        
        {message && (
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {message.text}
            </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Enlace de Zoom/Meet
            </label>
            <input
                type="url"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                className="w-full p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="https://zoom.us/..."
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Número de Sala
            </label>
            <input
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="w-full p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ej: Sala 1"
            />
          </div>
      </div>

      <div className="space-y-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 flex justify-between">
            <span>Nota Privada (Solo docentes)</span>
            <span className="text-xs text-zinc-400 font-normal">Visible solo para ti y otros docentes</span>
        </label>
        <textarea
            value={privateNote}
            onChange={(e) => setPrivateNote(e.target.value)}
            rows={4}
            className="w-full p-3 rounded-lg border border-yellow-200 dark:border-yellow-900/30 bg-yellow-50 dark:bg-yellow-900/10 focus:ring-2 focus:ring-yellow-500 outline-none transition-shadow"
            placeholder="Escribe aquí notas internas sobre el alumno o la revisión..."
        />
      </div>

      <div className="space-y-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 flex justify-between">
            <span>Nota Pública (Retroalimentación)</span>
            <span className="text-xs text-zinc-400 font-normal">Visible para el estudiante</span>
        </label>
        <textarea
            value={publicNote}
            onChange={(e) => setPublicNote(e.target.value)}
            rows={6}
            className="w-full p-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
            placeholder="Escribe aquí el feedback para el estudiante..."
        />
      </div>

      <div className="flex justify-end pt-4">
        <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium flex items-center gap-2 shadow-sm"
        >
            {isPending ? (
                <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                </>
            ) : (
                "Guardar Cambios"
            )}
        </button>
      </div>
    </form>
  );
}
