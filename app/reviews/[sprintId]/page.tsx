import { getSprint, getReviews } from "@/lib/data";
import { getCurrentUser } from "@/lib/pocketbase-server";
import { notFound, redirect } from "next/navigation";
import ReviewsManager from "@/components/reviews/ReviewsManager";
import Link from "next/link";
import { resolveCohortContext } from "@/lib/cohort-context";

interface PageProps {
  params: Promise<{ sprintId: string }>;
}

export const dynamic = 'force-dynamic';

export default async function SprintReviewsPage({ params }: PageProps) {
  const { sprintId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const sprint = await getSprint(sprintId);
  if (!sprint) {
    notFound();
  }

  const reviews = await getReviews(sprint.cohort, sprintId);
  const context = await resolveCohortContext(sprint.cohort);

  return (
    <div className="container mx-auto p-8 min-h-screen">
      <div className="mb-8 flex items-center gap-4">
        <Link 
            href={`/cohorts/${sprint.cohort}/reviews`}
            className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </Link>
        <div>
            <h1 className="text-3xl font-bold">Revisiones: {sprint.title}</h1>
            <p className="text-zinc-500 mt-2">Gestiona y reserva tus turnos de revisión.</p>
        </div>
      </div>

      <ReviewsManager 
        sprint={sprint}
        initialReviews={reviews}
        currentUser={user}
        canManage={context.permissions.has('manage-academics')}
        readOnly={context.cohort.status === 'archived'}
      />
    </div>
  );
}
