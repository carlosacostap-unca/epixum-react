import Link from 'next/link';
import InquiryList from '@/components/inquiries/InquiryList';
import { getInquiries } from '@/lib/actions-inquiries';
import { resolveCohortContext } from '@/lib/cohort-context';

export default async function InquiriesCohortView({ cohortId, search }: { cohortId: string; search?: string }) {
  const { user } = await resolveCohortContext(cohortId);
  const inquiries = await getInquiries(cohortId, { search });
  return (
    <main className="container mx-auto min-h-screen p-8">
      <div className="mb-8"><Link href="/" className="mb-4 inline-block text-sm text-blue-600 hover:underline">← Volver al inicio</Link><h1 className="mb-2 text-3xl font-extrabold tracking-tight lg:text-4xl">Consultas</h1><p className="text-xl text-zinc-500 dark:text-zinc-400">Preguntas y respuestas de la cohorte.</p></div>
      <InquiryList cohortId={cohortId} inquiries={inquiries} currentUser={user} showSearch />
    </main>
  );
}
