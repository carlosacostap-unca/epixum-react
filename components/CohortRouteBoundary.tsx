'use client';

export default function CohortRouteBoundary({
  cohortId,
  children,
}: {
  cohortId: string;
  children: React.ReactNode;
}) {
  return <div key={cohortId}>{children}</div>;
}
