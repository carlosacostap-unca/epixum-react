"use client";

import { createDelivery, updateDelivery } from "@/lib/actions";
import { Delivery } from "@/types";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface StudentDeliveryProps {
  assignmentId: string;
  delivery: Delivery | null;
}

export default function StudentDelivery({ assignmentId, delivery }: StudentDeliveryProps) {
  const [isEditing, setIsEditing] = useState(!delivery);
  
  // Initialize urls from delivery.repositoryUrl
  const [urls, setUrls] = useState<string[]>(() => {
    if (!delivery?.repositoryUrl) return [""];
    try {
      const parsed = JSON.parse(delivery.repositoryUrl);
      if (Array.isArray(parsed)) return parsed.length > 0 ? parsed : [""];
      return [delivery.repositoryUrl];
    } catch {
      return [delivery.repositoryUrl];
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const isDelivered = !!delivery;

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const addUrlField = () => {
    setUrls([...urls, ""]);
  };

  const removeUrlField = (index: number) => {
    if (urls.length === 1) {
        // If only one field, just clear it
        handleUrlChange(0, "");
        return;
    }
    const newUrls = urls.filter((_, i) => i !== index);
    setUrls(newUrls);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Filter empty URLs and ensure valid format (simple check)
    const validUrls = urls
        .map(u => u.trim())
        .filter(u => u !== "")
        .map(u => u.startsWith("http") ? u : `https://${u.replace(/^https?:\/\//, '')}`);

    if (validUrls.length === 0) {
        setError("Debes ingresar al menos una URL válida");
        setLoading(false);
        return;
    }

    const formData = new FormData();
    formData.append("assignmentId", assignmentId);
    // Store as JSON string
    formData.append("repositoryUrl", JSON.stringify(validUrls));

    try {
      const result = delivery 
        ? await updateDelivery(delivery.id, formData)
        : await createDelivery(formData);

      if (result.success) {
        setIsEditing(false);
        router.refresh();
      } else {
        setError(result.error || "Error al guardar la entrega");
      }
    } catch (err) {
      setError("Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  }

  // Parse delivery URLs for display
  const deliveryUrls: string[] = (() => {
      if (!delivery?.repositoryUrl) return [];
      try {
          const parsed = JSON.parse(delivery.repositoryUrl);
          if (Array.isArray(parsed)) return parsed;
          return [delivery.repositoryUrl];
      } catch {
          return [delivery.repositoryUrl];
      }
  })();

  return (
    <div className={`rounded-xl border p-6 transition-all ${
        isDelivered 
        ? "bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800" 
        : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
    }`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-3">
            <span className={`p-2 rounded-lg ${
                isDelivered 
                ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400" 
                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400"
            }`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </span>
            <div>
                <span className="block">Mi Entrega</span>
                {isDelivered && (
                    <span className="text-xs font-normal text-green-600 dark:text-green-400">
                        Tarea completada
                    </span>
                )}
            </div>
        </h2>
        
        <span className={`px-4 py-1.5 text-sm font-semibold rounded-full border ${
            isDelivered 
                ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800" 
                : "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-500 dark:border-yellow-800"
        }`}>
            {isDelivered ? "✅ Entregado" : "⏳ Pendiente"}
        </span>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {error}
        </div>
      )}

      {!isEditing && delivery ? (
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex-1 overflow-hidden">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                  Repositorios Entregados
                </label>
                <div className="space-y-3 mb-4">
                    {deliveryUrls.map((repoUrl, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-500">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                            </div>
                            <a 
                              href={repoUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-lg font-medium text-blue-600 hover:text-blue-800 hover:underline truncate"
                            >
                              {repoUrl}
                            </a>
                        </div>
                    ))}
                </div>
                
                <div className="flex items-center gap-2 text-sm text-zinc-500 bg-zinc-50 dark:bg-zinc-800/50 py-2 px-3 rounded-md inline-flex">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span>Entregado el <strong>{new Date(delivery.created).toLocaleDateString()}</strong> a las <strong>{new Date(delivery.created).toLocaleTimeString()}</strong></span>
                </div>
            </div>

            <button
                onClick={() => setIsEditing(true)}
                className="shrink-0 px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-sm flex items-center gap-2"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Modificar Entrega
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700">
          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              URLs de los Repositorios (GitHub)
            </label>
            
            <div className="space-y-3">
                {urls.map((u, idx) => (
                    <div key={idx} className="relative flex items-center gap-2">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-zinc-500 sm:text-sm">https://</span>
                            </div>
                            <input
                              type="text"
                              value={u.replace(/^https?:\/\//, '')}
                              onChange={(e) => handleUrlChange(idx, `https://${e.target.value.replace(/^https?:\/\//, '')}`)}
                              placeholder="github.com/usuario/repositorio"
                              className="block w-full pl-16 pr-10 py-3 sm:text-sm border-zinc-300 dark:border-zinc-600 rounded-lg focus:ring-purple-500 focus:border-purple-500 dark:bg-zinc-800 dark:text-white shadow-sm"
                              required={idx === 0} // Only first one required strictly, handled by validation anyway
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => removeUrlField(idx)}
                            className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                            title="Eliminar URL"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                ))}
            </div>

            <button
                type="button"
                onClick={addUrlField}
                className="mt-3 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-medium flex items-center gap-1"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                Agregar otro repositorio
            </button>

            <p className="mt-2 text-sm text-zinc-500">
                Asegúrate de que los repositorios sean públicos o accesibles para los docentes.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3">
            {isDelivered && (
                <button
                    type="button"
                    onClick={() => {
                        setIsEditing(false);
                        // Reset urls
                        try {
                            const parsed = JSON.parse(delivery?.repositoryUrl || "[]");
                            if (Array.isArray(parsed) && parsed.length > 0) setUrls(parsed);
                            else setUrls([delivery?.repositoryUrl || ""]);
                        } catch {
                            setUrls([delivery?.repositoryUrl || ""]);
                        }
                    }}
                    className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors"
                >
                    Cancelar
                </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              {loading && <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>}
              {delivery ? "Modificar Entrega" : "Realizar Entrega"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
