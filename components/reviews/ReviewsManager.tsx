"use client";

import { useState, useTransition } from "react";
import { Review, Sprint, User } from "@/types";
import { createReviewSlotsBatch, bookReviewSlot, cancelReviewBooking, deleteReviewSlot } from "@/lib/actions-reviews";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FormattedDate from "@/components/FormattedDate";

interface ReviewsManagerProps {
  sprint: Sprint;
  initialReviews: Review[];
  currentUser: User;
}

export default function ReviewsManager({ sprint, initialReviews, currentUser }: ReviewsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isCreating, setIsCreating] = useState(false);
  
  // New state for batch creation
  const [startDateTime, setStartDateTime] = useState("");
  const [slotDuration, setSlotDuration] = useState(15);
  const [slotQuantity, setSlotQuantity] = useState(1);
  const [breakDuration, setBreakDuration] = useState(0);
  const [breakFrequency, setBreakFrequency] = useState(0);
  const [meetingLink, setMeetingLink] = useState("");
  const [roomNumber, setRoomNumber] = useState("");

  const isTeacher = currentUser.role === "docente" || currentUser.role === "admin";
  const isStudent = currentUser.role === "estudiante";

  // Check if current student has a booking
  const myBooking = isStudent ? initialReviews.find(r => r.student === currentUser.id) : null;
  
  // Filter reviews if student has a booking
  const reviewsToDisplay = (isStudent && myBooking) ? [myBooking] : initialReviews;
  const title = (isStudent && myBooking) ? "Tu Turno Reservado" : "Turnos Disponibles";

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    startTransition(async () => {
        const start = new Date(startDateTime).toISOString();
        
        const res = await createReviewSlotsBatch(
            sprint.id, 
            start, 
            slotDuration, 
            slotQuantity, 
            breakDuration, 
            breakFrequency,
            meetingLink,
            roomNumber
        );

        if (res.success) {
            setIsCreating(false);
            setStartDateTime("");
            // Keep other settings as they might be reused
            router.refresh();
        } else {
            alert(res.error);
        }
    });
  };

  const handleBook = async (reviewId: string) => {
    if (!confirm("¿Confirmar reserva de este turno?")) return;
    
    startTransition(async () => {
        const res = await bookReviewSlot(reviewId);
        if (res.success) {
            router.refresh();
        } else {
            alert(res.error);
        }
    });
  };

  const handleCancel = async (reviewId: string) => {
    if (!confirm("¿Cancelar reserva?")) return;
    
    startTransition(async () => {
        const res = await cancelReviewBooking(reviewId);
        if (res.success) {
            router.refresh();
        } else {
            alert(res.error);
        }
    });
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm("¿Eliminar este turno?")) return;
    
    startTransition(async () => {
        const res = await deleteReviewSlot(reviewId);
        if (res.success) {
            router.refresh();
        } else {
            alert(res.error);
        }
    });
  };

  return (
    <div className="space-y-8">
        {/* Create Form for Teachers */}
        {isTeacher && (
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Gestionar Turnos</h2>
                    <button 
                        onClick={() => setIsCreating(!isCreating)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                        {isCreating ? "Cancelar" : "Crear Turnos"}
                    </button>
                </div>
                
                {isCreating && (
                    <form onSubmit={handleCreate} className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="col-span-1 md:col-span-2 lg:col-span-1">
                                <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">Inicio del primer turno</label>
                                <input 
                                    type="datetime-local" 
                                    required
                                    value={startDateTime}
                                    onChange={(e) => setStartDateTime(e.target.value)}
                                    className="w-full p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">Duración por turno (min)</label>
                                <input 
                                    type="number" 
                                    min="5"
                                    required
                                    value={slotDuration}
                                    onChange={(e) => setSlotDuration(parseInt(e.target.value) || 0)}
                                    className="w-full p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">Cantidad de turnos</label>
                                <input 
                                    type="number" 
                                    min="1"
                                    max="50"
                                    required
                                    value={slotQuantity}
                                    onChange={(e) => setSlotQuantity(parseInt(e.target.value) || 1)}
                                    className="w-full p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
                            <h3 className="text-sm font-bold mb-3 text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Configuración de Descansos (Opcional)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium mb-1 text-zinc-500 dark:text-zinc-400">Duración del descanso (min)</label>
                                    <input 
                                        type="number" 
                                        min="0"
                                        value={breakDuration}
                                        onChange={(e) => setBreakDuration(parseInt(e.target.value) || 0)}
                                        className="w-full p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        placeholder="0 para desactivar"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1 text-zinc-500 dark:text-zinc-400">Aplicar cada X turnos</label>
                                    <input 
                                        type="number" 
                                        min="0"
                                        value={breakFrequency}
                                        onChange={(e) => setBreakFrequency(parseInt(e.target.value) || 0)}
                                        className="w-full p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        placeholder="Ej: 2 (descanso cada 2 turnos)"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">Enlace de Zoom/Meet (Opcional)</label>
                            <input 
                                type="url" 
                                value={meetingLink}
                                onChange={(e) => setMeetingLink(e.target.value)}
                                className="w-full p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="https://zoom.us/..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">Número de Sala (Opcional)</label>
                            <input 
                                type="text" 
                                value={roomNumber}
                                onChange={(e) => setRoomNumber(e.target.value)}
                                className="w-full p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Ej: Sala 1"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button 
                                type="submit" 
                                disabled={isPending}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium flex items-center gap-2"
                            >
                                {isPending ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Generando...
                                    </>
                                ) : (
                                    "Generar Turnos"
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        )}

        {/* Reviews List */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                <h2 className="text-xl font-bold">{title}</h2>
                <span className="text-sm text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full">
                    Total: {reviewsToDisplay.length}
                </span>
            </div>
            
            {reviewsToDisplay.length === 0 ? (
                <div className="p-12 text-center text-zinc-500 dark:text-zinc-400">
                    No hay turnos creados para este sprint.
                </div>
            ) : (
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {reviewsToDisplay.map((review) => {
                        const isBooked = !!review.student;
                        const isMyBooking = review.student === currentUser.id;
                        const studentName = review.expand?.student?.name || "Estudiante";
                        
                        const status = review.status || 'Pendiente';
                        let statusColor = "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300";
                        if (status === 'Aprobado') {
                            statusColor = "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300";
                        } else if (status === 'No presentó') {
                            statusColor = "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300";
                        } else if (status === 'Desaprobado') {
                            statusColor = "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300";
                        }

                        return (
                            <div key={review.id} className={`p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${isMyBooking ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-lg">
                                                <FormattedDate date={review.startTime} showTime={true} /> 
                                                <span className="mx-2 text-zinc-400">-</span>
                                                <FormattedDate date={review.endTime} showTime={true} />
                                            </span>
                                            {(review.meetingLink || review.roomNumber) && (
                                                <div className="flex flex-wrap gap-3 text-sm mt-1">
                                                    {review.meetingLink && (
                                                        <a href={review.meetingLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                                            Unirse a la reunión
                                                        </a>
                                                    )}
                                                    {review.roomNumber && (
                                                        <span className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                                            Sala: {review.roomNumber}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {isBooked ? (
                                        <div className="flex items-center gap-2 text-sm flex-wrap">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${isMyBooking ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                                                Reservado
                                            </span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusColor}`}>
                                                {status}
                                            </span>
                                            {isTeacher && (
                                                <span className="text-zinc-600 dark:text-zinc-400">
                                                    por <strong>{studentName}</strong>
                                                </span>
                                            )}
                                            {isMyBooking && (
                                                <span className="text-blue-600 dark:text-blue-400 font-medium">
                                                    (Tu reserva)
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                            Disponible
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-3">
                                    {isTeacher && (
                                        <>
                                            {isBooked && (
                                                <>
                                                    <Link 
                                                        href={`/reviews/detail/${review.id}`}
                                                        className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center gap-1"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                        Ver Detalle
                                                    </Link>
                                                    <button 
                                                        onClick={() => handleCancel(review.id)}
                                                        disabled={isPending}
                                                        className="px-4 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                                                    >
                                                        Liberar
                                                    </button>
                                                </>
                                            )}
                                            <button 
                                                onClick={() => handleDelete(review.id)}
                                                disabled={isPending}
                                                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            >
                                                Eliminar
                                            </button>
                                        </>
                                    )}

                                    {isStudent && (
                                        <>
                                            {isMyBooking ? (
                                                <>
                                                    <Link 
                                                        href={`/reviews/detail/${review.id}`}
                                                        className="px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-lg transition-colors font-medium text-sm flex items-center gap-1"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                        Ver Detalle
                                                    </Link>
                                                    <button 
                                                        onClick={() => handleCancel(review.id)}
                                                        disabled={isPending}
                                                        className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded-lg transition-colors font-medium text-sm"
                                                    >
                                                        Cancelar Reserva
                                                    </button>
                                                </>
                                            ) : !isBooked && !myBooking ? (
                                                <button 
                                                    onClick={() => handleBook(review.id)}
                                                    disabled={isPending}
                                                    className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors font-medium text-sm shadow-sm"
                                                >
                                                    Reservar Turno
                                                </button>
                                            ) : !isBooked && myBooking ? (
                                                <span className="text-xs text-zinc-500 italic px-2">
                                                    Ya tienes una reserva
                                                </span>
                                            ) : (
                                                <span className="text-xs text-zinc-400 italic px-2">
                                                    No disponible
                                                </span>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    </div>
  );
}
