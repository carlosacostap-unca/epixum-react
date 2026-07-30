import type PocketBase from "pocketbase";
import type { RecordModel } from "pocketbase";

const BASELINE_DATA_COLLECTIONS = [
  "users",
  "sprints",
  "classes",
  "assignments",
  "inquiries",
  "reviews",
  "deliveries",
] as const;

export type MigrationPhase = "course" | "cohort" | "enrollments" | "sprints" | "inquiries";

export type DataMigrationReport = {
  initialCourseId: string;
  initialCohortId: string;
  created: Record<string, number>;
  updated: Record<string, number>;
  beforeCounts: Record<string, number>;
  afterCounts: Record<string, number>;
  checks: {
    unchangedBaselineCounts: boolean;
    orphanSprints: number;
    orphanInquiries: number;
    invalidInquiryRelationChains: number;
    duplicateEnrollments: number;
    missingActiveEnrollments: number;
    administratorEnrollments: number;
  };
  stoppedAfter?: MigrationPhase;
};

function stringValue(record: RecordModel, field: string): string {
  const raw = record[field];
  return typeof raw === "string" ? raw : "";
}

function dateValue(record: RecordModel, field: string): string | null {
  const value = stringValue(record, field);
  return value || null;
}

export function deriveInitialCohortDates(sprints: RecordModel[]): { startDate: string; endDate: string } {
  const starts = sprints.map((record) => dateValue(record, "startDate")).filter((value): value is string => Boolean(value)).sort();
  const ends = sprints.map((record) => dateValue(record, "endDate")).filter((value): value is string => Boolean(value)).sort();
  return {
    startDate: starts[0] ?? "2000-01-01 00:00:00.000Z",
    endDate: ends.at(-1) ?? starts[0] ?? "2000-01-01 00:00:00.000Z",
  };
}

export function contextualRole(globalRole: string): "student" | "teacher" | null {
  if (globalRole === "estudiante") return "student";
  if (globalRole === "docente") return "teacher";
  return null;
}

async function counts(pb: PocketBase): Promise<Record<string, number>> {
  const result: Record<string, number> = {};
  for (const name of BASELINE_DATA_COLLECTIONS) {
    result[name] = (await pb.collection(name).getList(1, 1, { requestKey: null })).totalItems;
  }
  return result;
}

export async function planCohortDataBeforeSchema(pb: PocketBase): Promise<DataMigrationReport> {
  const [beforeCounts, users, sprints, inquiries] = await Promise.all([
    counts(pb),
    pb.collection("users").getFullList({ requestKey: null }),
    pb.collection("sprints").getFullList({ requestKey: null }),
    pb.collection("inquiries").getFullList({ requestKey: null }),
  ]);
  return {
    initialCourseId: "__initial_course__",
    initialCohortId: "__initial_cohort__",
    created: {
      courses: 1,
      cohorts: 1,
      enrollments: users.filter((user) => contextualRole(stringValue(user, "role"))).length,
    },
    updated: { sprints: sprints.length, inquiries: inquiries.length },
    beforeCounts,
    afterCounts: { ...beforeCounts },
    checks: emptyChecks(),
  };
}

async function existingByName(pb: PocketBase, collection: string, name: string) {
  const records = await pb.collection(collection).getFullList({ requestKey: null });
  return records.find((record) => stringValue(record, "name") === name) ?? null;
}

function emptyChecks() {
  return {
    unchangedBaselineCounts: false,
    orphanSprints: -1,
    orphanInquiries: -1,
    invalidInquiryRelationChains: -1,
    duplicateEnrollments: -1,
    missingActiveEnrollments: -1,
    administratorEnrollments: -1,
  };
}

export async function migrateCohortData(
  pb: PocketBase,
  options: { apply: boolean; stopAfter?: MigrationPhase },
): Promise<DataMigrationReport> {
  const beforeCounts = await counts(pb);
  const sprints = await pb.collection("sprints").getFullList({ requestKey: null });
  const dates = deriveInitialCohortDates(sprints);
  const created: Record<string, number> = { courses: 0, cohorts: 0, enrollments: 0 };
  const updated: Record<string, number> = { sprints: 0, inquiries: 0 };

  let course = await existingByName(pb, "courses", "React");
  if (!course) {
    created.courses += 1;
    if (options.apply) {
      course = await pb.collection("courses").create({ name: "React", description: "Curso existente migrado", status: "active" });
    }
  } else if (stringValue(course, "status") !== "active") {
    updated.courses = (updated.courses ?? 0) + 1;
    if (options.apply) course = await pb.collection("courses").update(course.id, { status: "active" });
  }
  const courseId = course?.id ?? "__initial_course__";
  if (options.stopAfter === "course") return stoppedReport(courseId, "", created, updated, beforeCounts, "course");

  const cohorts = await pb.collection("cohorts").getFullList({ requestKey: null });
  let cohort = cohorts.find((record) => stringValue(record, "course") === courseId && stringValue(record, "name") === "Cohorte inicial") ?? null;
  if (!cohort) {
    created.cohorts += 1;
    if (options.apply) {
      cohort = await pb.collection("cohorts").create({
        course: courseId,
        name: "Cohorte inicial",
        ...dates,
        status: "active",
      });
    }
  } else if (
    stringValue(cohort, "startDate") !== dates.startDate
    || stringValue(cohort, "endDate") !== dates.endDate
    || stringValue(cohort, "status") !== "active"
  ) {
    updated.cohorts = (updated.cohorts ?? 0) + 1;
    if (options.apply) cohort = await pb.collection("cohorts").update(cohort.id, { ...dates, status: "active" });
  }
  const cohortId = cohort?.id ?? "__initial_cohort__";
  if (options.stopAfter === "cohort") return stoppedReport(courseId, cohortId, created, updated, beforeCounts, "cohort");

  const [users, enrollments] = await Promise.all([
    pb.collection("users").getFullList({ requestKey: null }),
    pb.collection("enrollments").getFullList({ requestKey: null }),
  ]);
  for (const user of users) {
    const role = contextualRole(stringValue(user, "role"));
    if (!role) continue;
    const existing = enrollments.find(
      (record) => stringValue(record, "cohort") === cohortId && stringValue(record, "user") === user.id,
    );
    if (!existing) {
      created.enrollments += 1;
      if (options.apply) await pb.collection("enrollments").create({ cohort: cohortId, user: user.id, role, status: "active" });
    } else if (stringValue(existing, "role") !== role || stringValue(existing, "status") !== "active") {
      updated.enrollments = (updated.enrollments ?? 0) + 1;
      if (options.apply) await pb.collection("enrollments").update(existing.id, { role, status: "active" });
    }
  }
  if (options.stopAfter === "enrollments") return stoppedReport(courseId, cohortId, created, updated, beforeCounts, "enrollments");

  for (const sprint of sprints) {
    if (!stringValue(sprint, "cohort")) {
      updated.sprints += 1;
      if (options.apply) await pb.collection("sprints").update(sprint.id, { cohort: cohortId });
    }
  }
  if (options.stopAfter === "sprints") return stoppedReport(courseId, cohortId, created, updated, beforeCounts, "sprints");

  const [classes, assignments, inquiries] = await Promise.all([
    pb.collection("classes").getFullList({ requestKey: null }),
    pb.collection("assignments").getFullList({ requestKey: null }),
    pb.collection("inquiries").getFullList({ requestKey: null }),
  ]);
  const sprintCohorts = new Map(sprints.map((sprint) => [sprint.id, stringValue(sprint, "cohort") || cohortId]));
  const classCohorts = new Map(classes.map((record) => [record.id, sprintCohorts.get(stringValue(record, "sprint"))]));
  const assignmentCohorts = new Map(assignments.map((record) => [record.id, sprintCohorts.get(stringValue(record, "sprint"))]));
  for (const inquiry of inquiries) {
    const derived = classCohorts.get(stringValue(inquiry, "class"))
      ?? assignmentCohorts.get(stringValue(inquiry, "assignment"))
      ?? cohortId;
    if (!stringValue(inquiry, "cohort")) {
      updated.inquiries += 1;
      if (options.apply) await pb.collection("inquiries").update(inquiry.id, { cohort: derived });
    }
  }
  if (options.stopAfter === "inquiries") return stoppedReport(courseId, cohortId, created, updated, beforeCounts, "inquiries");

  const afterCounts = await counts(pb);
  const [finalSprints, finalInquiries, finalEnrollments] = await Promise.all([
    pb.collection("sprints").getFullList({ requestKey: null }),
    pb.collection("inquiries").getFullList({ requestKey: null }),
    pb.collection("enrollments").getFullList({ requestKey: null }),
  ]);
  const sprintIds = new Set(finalSprints.map((record) => record.id));
  const classSprint = new Map(classes.map((record) => [record.id, stringValue(record, "sprint")]));
  const assignmentSprint = new Map(assignments.map((record) => [record.id, stringValue(record, "sprint")]));
  let invalidInquiryRelationChains = 0;
  for (const inquiry of finalInquiries) {
    const relatedSprint = classSprint.get(stringValue(inquiry, "class"))
      ?? assignmentSprint.get(stringValue(inquiry, "assignment"));
    if (relatedSprint && !sprintIds.has(relatedSprint)) invalidInquiryRelationChains += 1;
  }
  const enrollmentKeys = finalEnrollments.map((record) => `${stringValue(record, "cohort")}:${stringValue(record, "user")}`);
  const duplicateEnrollments = enrollmentKeys.length - new Set(enrollmentKeys).size;
  const activeEnrollmentUsers = new Set(
    finalEnrollments
      .filter((record) => stringValue(record, "cohort") === cohortId && stringValue(record, "status") === "active")
      .map((record) => stringValue(record, "user")),
  );
  const educationalUsers = users.filter((user) => contextualRole(stringValue(user, "role")));
  const administratorIds = new Set(users.filter((user) => stringValue(user, "role") === "admin").map((user) => user.id));

  return {
    initialCourseId: courseId,
    initialCohortId: cohortId,
    created,
    updated,
    beforeCounts,
    afterCounts,
    checks: {
      unchangedBaselineCounts: BASELINE_DATA_COLLECTIONS.every((name) => beforeCounts[name] === afterCounts[name]),
      orphanSprints: finalSprints.filter((record) => !stringValue(record, "cohort")).length,
      orphanInquiries: finalInquiries.filter((record) => !stringValue(record, "cohort")).length,
      invalidInquiryRelationChains,
      duplicateEnrollments,
      missingActiveEnrollments: educationalUsers.filter((user) => !activeEnrollmentUsers.has(user.id)).length,
      administratorEnrollments: finalEnrollments.filter(
        (record) => stringValue(record, "cohort") === cohortId && administratorIds.has(stringValue(record, "user")),
      ).length,
    },
  };
}

function stoppedReport(
  initialCourseId: string,
  initialCohortId: string,
  created: Record<string, number>,
  updated: Record<string, number>,
  beforeCounts: Record<string, number>,
  stoppedAfter: MigrationPhase,
): DataMigrationReport {
  return {
    initialCourseId,
    initialCohortId,
    created,
    updated,
    beforeCounts,
    afterCounts: {},
    checks: emptyChecks(),
    stoppedAfter,
  };
}
