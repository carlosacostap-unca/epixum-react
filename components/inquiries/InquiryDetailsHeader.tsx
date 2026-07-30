"use client";

import { Inquiry, User } from "@/types";
import { updateInquiryStatus, deleteInquiry } from "@/lib/actions-inquiries";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import FormattedDate from "@/components/FormattedDate";
import Link from "next/link";

interface InquiryDetailsHeaderProps {
  inquiry: Inquiry;
  currentUser: User | null;
  canModerate: boolean;
  readOnly: boolean;
}

export default function InquiryDetailsHeader({ inquiry, currentUser, canModerate, readOnly }: InquiryDetailsHeaderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isAuthor = currentUser?.id === inquiry.author;
  const canModify = !readOnly && (isAuthor || canModerate);

  const handleStatusChange = async (newStatus: "Pendiente" | "Resuelta") => {
    startTransition(async () => {
      await updateInquiryStatus(inquiry.id, newStatus);
      router.refresh();
    });
  };

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta consulta? Esta acción no se puede deshacer.")) return;
    
    startTransition(async () => {
      const result = await deleteInquiry(inquiry.id);
      if (result.success) {
        router.push(`/cohorts/${inquiry.cohort}/inquiries`);
      } else {
        alert(result.error);
      }
    });
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span
                className={`px-3 py-1 text-sm font-bold rounded-full ${
                inquiry.status === "Resuelta"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                }`}
            >
                {inquiry.status === "Resuelta" ? "Resuelta" : "Pendiente"}
            </span>
            {(inquiry.expand?.class || inquiry.expand?.assignment) && (
                <span className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                en
                {inquiry.expand?.class && (
                    <Link href={`/classes/${inquiry.class}`} className="font-medium hover:underline text-blue-600 dark:text-blue-400">
                        {inquiry.expand.class.title}
                    </Link>
                )}
                {inquiry.expand?.assignment && (
                    <Link href={`/assignments/${inquiry.assignment}`} className="font-medium hover:underline text-purple-600 dark:text-purple-400">
                        {inquiry.expand.assignment.title}
                    </Link>
                )}
                </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {inquiry.title}
          </h1>
        </div>
        
        {canModify && (
            <div className="flex items-center gap-2">
                {inquiry.status === "Pendiente" ? (
                    <button
                        onClick={() => handleStatusChange("Resuelta")}
                        disabled={isPending}
                        className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors"
                    >
                        Marcar como Resuelta
                    </button>
                ) : (
                    <button
                        onClick={() => handleStatusChange("Pendiente")}
                        disabled={isPending}
                        className="px-3 py-1.5 text-sm font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-md hover:bg-yellow-100 transition-colors"
                    >
                        Reabrir Consulta
                    </button>
                )}
                
                <button
                    onClick={handleDelete}
                    disabled={isPending}
                    className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    title="Eliminar consulta"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        )}
      </div>

      <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap mb-6 text-lg">
        {inquiry.description}
      </p>

      <div className="flex items-center gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
        {inquiry.expand?.author?.avatar ? (
            <img
                src={`${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/_pb_users_auth_/${inquiry.expand.author.id}/${inquiry.expand.author.avatar}`}
                className="w-8 h-8 rounded-full object-cover"
                alt=""
            />
        ) : (
            <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-sm font-bold text-zinc-500">
                {inquiry.expand?.author?.name?.charAt(0) || "?"}
            </div>
        )}
        <div className="flex flex-col">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {inquiry.expand?.author?.name || "Usuario desconocido"}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Publicado el <FormattedDate date={inquiry.created} />
            </span>
        </div>
      </div>
    </div>
  );
}
