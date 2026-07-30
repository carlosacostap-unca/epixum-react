import { getInquiry, getInquiryResponses } from "@/lib/actions-inquiries";
import { getCurrentUser } from "@/lib/pocketbase-server";
import InquiryDetailsHeader from "@/components/inquiries/InquiryDetailsHeader";
import InquiryResponseList from "@/components/inquiries/InquiryResponseList";
import InquiryResponseForm from "@/components/inquiries/InquiryResponseForm";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function InquiryDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  const inquiryResult = await getInquiry(id);

  if (!inquiryResult.success || !inquiryResult.data) {
    notFound();
  }

  const inquiry = inquiryResult.data;
  const responses = await getInquiryResponses(id);

  return (
    <div className="container mx-auto p-8 min-h-screen max-w-4xl">
      <Link href={`/cohorts/${inquiry.cohort}/inquiries`} className="text-sm text-blue-600 hover:underline mb-6 inline-block">&larr; Volver a consultas</Link>
      
      <InquiryDetailsHeader inquiry={inquiry} currentUser={user} canModerate={inquiryResult.canManage === true} readOnly={inquiryResult.readOnly === true} />

      <div className="mt-10">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            Respuestas ({responses.length})
        </h2>
        
        <InquiryResponseList 
            responses={responses} 
            currentUser={user} 
            inquiryId={inquiry.id} 
        />

        {user && !inquiryResult.readOnly && (
            <InquiryResponseForm inquiryId={inquiry.id} />
        )}
      </div>
    </div>
  );
}
