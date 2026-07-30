import CreateInquiryForm from "@/components/inquiries/CreateInquiryForm";
import { getAllClasses, getAllAssignments, getSprints } from "@/lib/data";
import { getDefaultAccessibleCohort } from "@/lib/data-cohorts";
import { resolveCohortContext } from "@/lib/cohort-context";
import { redirect } from "next/navigation";

export default async function NewInquiryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const classId = typeof resolvedSearchParams.classId === "string" ? resolvedSearchParams.classId : undefined;
  const assignmentId = typeof resolvedSearchParams.assignmentId === "string" ? resolvedSearchParams.assignmentId : undefined;
  const requestedCohortId = typeof resolvedSearchParams.cohortId === "string" ? resolvedSearchParams.cohortId : undefined;

  const cohort = requestedCohortId
    ? (await resolveCohortContext(requestedCohortId)).cohort
    : await getDefaultAccessibleCohort();
  if (!cohort) redirect('/');
  const classes = await getAllClasses(cohort.id);
  const assignments = await getAllAssignments(cohort.id);
  const sprints = await getSprints(cohort.id);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-white">Nueva Consulta</h1>
      <CreateInquiryForm 
        cohortId={cohort.id}
        initialClassId={classId} 
        initialAssignmentId={assignmentId} 
        classes={classes}
        assignments={assignments}
        sprints={sprints}
      />
    </div>
  );
}
