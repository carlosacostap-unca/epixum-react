import Link from 'next/link';

export default function NoCohortState() {
  return (
    <main className="container mx-auto min-h-[60vh] px-6 py-16 text-center">
      <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-zinc-300 bg-white p-10 dark:border-zinc-700 dark:bg-zinc-900">
        <h1 className="text-2xl font-bold">No tenés una cohorte disponible</h1>
        <p className="mt-3 text-zinc-500 dark:text-zinc-400">
          Tu inscripción puede estar inactiva o la cohorte puede haber sido archivada. Contactá a un administrador para recuperar el acceso.
        </p>
        <Link href="/profile" className="mt-6 inline-block text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
          Ver mi perfil
        </Link>
      </div>
    </main>
  );
}
