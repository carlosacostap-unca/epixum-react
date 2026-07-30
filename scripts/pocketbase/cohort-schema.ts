import type PocketBase from "pocketbase";
import { ClientResponseError } from "pocketbase";

type FieldDefinition = Record<string, unknown> & { name: string; type: string };
type CollectionDefinition = {
  name: string;
  type: "base";
  fields: FieldDefinition[];
  indexes?: string[];
  listRule?: string | null;
  viewRule?: string | null;
  createRule?: string | null;
  updateRule?: string | null;
  deleteRule?: string | null;
};

export type SchemaChange = {
  action: "create-collection" | "update-collection";
  collection: string;
  fields?: string[];
  indexes?: string[];
};

const adminRule = '@request.auth.role = "admin"';
const authenticatedRule = '@request.auth.id != ""';
const activeEnrollmentForCohort =
  '(@collection.enrollments.cohort ?= id && @collection.enrollments.user ?= @request.auth.id && @collection.enrollments.status ?= "active")';

function relation(name: string, collectionId: string, required = true): FieldDefinition {
  return { name, type: "relation", collectionId, maxSelect: 1, required, cascadeDelete: false };
}

export function cohortCollectionDefinitions(ids: Record<string, string>): CollectionDefinition[] {
  return [
    {
      name: "courses",
      type: "base",
      listRule: authenticatedRule,
      viewRule: authenticatedRule,
      createRule: adminRule,
      updateRule: adminRule,
      deleteRule: adminRule,
      fields: [
        { name: "name", type: "text", required: true, max: 200 },
        { name: "description", type: "text", required: false, max: 5000 },
        { name: "status", type: "select", required: true, maxSelect: 1, values: ["active", "archived"] },
      ],
      indexes: ["CREATE UNIQUE INDEX `idx_courses_name` ON `courses` (`name`)"]
    },
    {
      name: "cohorts",
      type: "base",
      listRule: `${adminRule} || ${activeEnrollmentForCohort}`,
      viewRule: `${adminRule} || ${activeEnrollmentForCohort}`,
      createRule: `${adminRule} || (@request.auth.role = "docente" && @request.body.status = "planned")`,
      updateRule: `${adminRule} || (@request.auth.role = "docente" && status != "archived" && ${activeEnrollmentForCohort} && (@request.body.status:changed = false || (status = "planned" && @request.body.status = "active") || (@request.body.status = "archived" && @request.body.course:changed = false && @request.body.name:changed = false && @request.body.startDate:changed = false && @request.body.endDate:changed = false)))`,
      deleteRule: adminRule,
      fields: [
        relation("course", ids.courses),
        { name: "name", type: "text", required: true, max: 200 },
        { name: "startDate", type: "date", required: true },
        { name: "endDate", type: "date", required: true },
        { name: "status", type: "select", required: true, maxSelect: 1, values: ["planned", "active", "archived"] },
      ],
      indexes: ["CREATE UNIQUE INDEX `idx_cohorts_course_name` ON `cohorts` (`course`, `name`)"]
    },
    {
      name: "enrollments",
      type: "base",
      listRule: `${adminRule} || user = @request.auth.id || (@request.auth.role = "docente" && @collection.enrollments:manager.cohort ?= cohort && @collection.enrollments:manager.user ?= @request.auth.id && @collection.enrollments:manager.role ?= "teacher" && @collection.enrollments:manager.status ?= "active")`,
      viewRule: `${adminRule} || user = @request.auth.id || (@request.auth.role = "docente" && @collection.enrollments:manager.cohort ?= cohort && @collection.enrollments:manager.user ?= @request.auth.id && @collection.enrollments:manager.role ?= "teacher" && @collection.enrollments:manager.status ?= "active")`,
      createRule: `${adminRule} || (@request.auth.role = "docente" && @request.body.role = "student" && @request.body.status = "active" && @request.body.user.role = "estudiante" && @collection.enrollments:manager.cohort ?= @request.body.cohort && @collection.enrollments:manager.user ?= @request.auth.id && @collection.enrollments:manager.role ?= "teacher" && @collection.enrollments:manager.status ?= "active")`,
      updateRule: `${adminRule} || (@request.auth.role = "docente" && role = "student" && user.role = "estudiante" && @request.body.cohort:changed = false && @request.body.user:changed = false && @request.body.role:changed = false && @collection.enrollments:manager.cohort ?= cohort && @collection.enrollments:manager.user ?= @request.auth.id && @collection.enrollments:manager.role ?= "teacher" && @collection.enrollments:manager.status ?= "active")`,
      deleteRule: adminRule,
      fields: [
        relation("cohort", ids.cohorts),
        relation("user", ids.users),
        { name: "role", type: "select", required: true, maxSelect: 1, values: ["student", "teacher"] },
        { name: "status", type: "select", required: true, maxSelect: 1, values: ["active", "inactive"] },
      ],
      indexes: ["CREATE UNIQUE INDEX `idx_enrollments_cohort_user` ON `enrollments` (`cohort`, `user`)"]
    },
    {
      name: "review_private_notes",
      type: "base",
      listRule: adminRule,
      viewRule: adminRule,
      createRule: adminRule,
      updateRule: adminRule,
      deleteRule: adminRule,
      fields: [
        relation("review", ids.reviews),
        { name: "content", type: "text", required: false, max: 20000 },
      ],
      indexes: ["CREATE UNIQUE INDEX `idx_review_private_notes_review` ON `review_private_notes` (`review`)"]
    },
  ];
}

async function getCollection(pb: PocketBase, name: string) {
  try {
    return await pb.collections.getOne(name);
  } catch (error) {
    if (error instanceof ClientResponseError && error.status === 404) return null;
    throw error;
  }
}

function fieldNeedsUpdate(current: Record<string, unknown>, desired: FieldDefinition): boolean {
  return Object.entries(desired).some(([key, value]) => JSON.stringify(current[key]) !== JSON.stringify(value));
}

export async function ensureCollection(
  pb: PocketBase,
  desired: CollectionDefinition,
  apply: boolean,
): Promise<SchemaChange | null> {
  const current = await getCollection(pb, desired.name);
  if (!current) {
    if (apply) await pb.collections.create(desired as never);
    return { action: "create-collection", collection: desired.name, fields: desired.fields.map((field) => field.name), indexes: desired.indexes };
  }

  const currentFields = current.fields as unknown as Array<Record<string, unknown>>;
  const nextFields = [...currentFields];
  const changedFields: string[] = [];
  for (const field of desired.fields) {
    const index = nextFields.findIndex((candidate) => candidate.name === field.name);
    if (index < 0) {
      nextFields.push(field);
      changedFields.push(field.name);
    } else if (fieldNeedsUpdate(nextFields[index], field)) {
      nextFields[index] = { ...nextFields[index], ...field };
      changedFields.push(field.name);
    }
  }

  const desiredIndexes = desired.indexes ?? [];
  const nextIndexes = Array.from(new Set([...(current.indexes ?? []), ...desiredIndexes]));
  const changedIndexes = desiredIndexes.filter((index) => !(current.indexes ?? []).includes(index));
  const rulesChanged = ["listRule", "viewRule", "createRule", "updateRule", "deleteRule"].some(
    (key) => current[key as keyof typeof current] !== desired[key as keyof CollectionDefinition],
  );

  if (!changedFields.length && !changedIndexes.length && !rulesChanged) return null;
  if (apply) {
    await pb.collections.update(current.id, {
      fields: nextFields,
      indexes: nextIndexes,
      listRule: desired.listRule,
      viewRule: desired.viewRule,
      createRule: desired.createRule,
      updateRule: desired.updateRule,
      deleteRule: desired.deleteRule,
    });
  }
  return { action: "update-collection", collection: desired.name, fields: changedFields, indexes: changedIndexes };
}

export async function ensureCohortSchema(pb: PocketBase, apply: boolean): Promise<SchemaChange[]> {
  const required = ["users", "sprints", "inquiries", "reviews"];
  const ids: Record<string, string> = {};
  for (const name of required) {
    const collection = await getCollection(pb, name);
    if (!collection) throw new Error(`Required baseline collection is missing: ${name}`);
    ids[name] = collection.id;
  }

  const changes: SchemaChange[] = [];
  const courseDefinition = cohortCollectionDefinitions({ ...ids, courses: "pending", cohorts: "pending" })[0];
  const courseChange = await ensureCollection(pb, courseDefinition, apply);
  if (courseChange) changes.push(courseChange);
  const courses = apply ? await pb.collections.getOne("courses") : await getCollection(pb, "courses");
  ids.courses = courses?.id ?? "__courses_collection_id__";

  const cohortDefinition = cohortCollectionDefinitions({ ...ids, cohorts: "pending" })[1];
  const existingCohorts = await getCollection(pb, "cohorts");
  const bootstrapCohortDefinition = {
    ...cohortDefinition,
    listRule: adminRule,
    viewRule: adminRule,
    createRule: adminRule,
    updateRule: adminRule,
  };
  const cohortChange = await ensureCollection(
    pb,
    existingCohorts ? cohortDefinition : bootstrapCohortDefinition,
    apply,
  );
  if (cohortChange) changes.push(cohortChange);
  const cohorts = apply ? await pb.collections.getOne("cohorts") : await getCollection(pb, "cohorts");
  ids.cohorts = cohorts?.id ?? "__cohorts_collection_id__";

  for (const definition of cohortCollectionDefinitions(ids).slice(2)) {
    const change = await ensureCollection(pb, definition, apply);
    if (change) changes.push(change);
  }

  // Enrollment-aware cohort rules can only be validated after the relation
  // collection exists. Reconcile the final definition as a separate step.
  const finalCohortChange = await ensureCollection(pb, cohortCollectionDefinitions(ids)[1], apply);
  if (finalCohortChange) changes.push(finalCohortChange);

  for (const [collectionName, field] of [
    ["sprints", relation("cohort", ids.cohorts, false)],
    ["inquiries", relation("cohort", ids.cohorts, false)],
  ] as const) {
    const collection = await pb.collections.getOne(collectionName);
    const desired: CollectionDefinition = {
      name: collectionName,
      type: "base",
      fields: [field],
      indexes: [],
      listRule: collection.listRule,
      viewRule: collection.viewRule,
      createRule: collection.createRule,
      updateRule: collection.updateRule,
      deleteRule: collection.deleteRule,
    };
    const change = await ensureCollection(pb, desired, apply);
    if (change) changes.push(change);
  }

  const reviews = await pb.collections.getOne("reviews");
  const reservationIndex = "CREATE UNIQUE INDEX `idx_reviews_sprint_student` ON `reviews` (`sprint`, `student`) WHERE `student` != ''";
  const reviewDefinition: CollectionDefinition = {
    name: "reviews",
    type: "base",
    fields: [],
    indexes: [reservationIndex],
    listRule: reviews.listRule,
    viewRule: reviews.viewRule,
    createRule: reviews.createRule,
    updateRule: reviews.updateRule,
    deleteRule: reviews.deleteRule,
  };
  const reviewChange = await ensureCollection(pb, reviewDefinition, apply);
  if (reviewChange) changes.push(reviewChange);

  return changes;
}
