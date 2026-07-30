import StudentsCohortView from '@/components/cohorts/StudentsCohortView';

export const metadata = { title: 'Estudiantes | Epixum - React' };

export default async function StudentsPage({ params }: { params: Promise<{ cohortId: string }> }) {
  const { cohortId } = await params;
  return <StudentsCohortView cohortId={cohortId} />;
}
