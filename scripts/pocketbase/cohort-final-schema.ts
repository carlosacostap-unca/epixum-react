import type PocketBase from "pocketbase";
import type { CollectionModel } from "pocketbase";

const admin = '@request.auth.role = "admin"';

function activeMember(cohort: string) {
  return `(@request.auth.id != "" && @collection.enrollments.cohort ?= ${cohort} && @collection.enrollments.user ?= @request.auth.id && @collection.enrollments.status ?= "active")`;
}

function activeTeacher(cohort: string) {
  return `(@request.auth.role = "docente" && @collection.enrollments.cohort ?= ${cohort} && @collection.enrollments.user ?= @request.auth.id && @collection.enrollments.role ?= "teacher" && @collection.enrollments.status ?= "active")`;
}

const eitherContext = (classCohort: string, assignmentCohort: string, predicate: (cohort: string) => string) =>
  `(${predicate(classCohort)} || ${predicate(assignmentCohort)})`;

export type FinalRuleSet = Pick<CollectionModel, "listRule" | "viewRule" | "createRule" | "updateRule" | "deleteRule">;

export function finalEducationalRules(): Record<string, FinalRuleSet> {
  const member = (cohort: string) => `(${admin} || ${activeMember(cohort)})`;
  const teacher = (cohort: string) => `(${admin} || ${activeTeacher(cohort)})`;
  const studentReviewUpdate = [
    '@request.auth.role = "estudiante"',
    activeMember('sprint.cohort'),
    '@request.body.sprint:changed = false',
    '@request.body.teacher:changed = false',
    '@request.body.startTime:changed = false',
    '@request.body.endTime:changed = false',
    '@request.body.public_note:changed = false',
    '@request.body.status:changed = false',
    '@request.body.meetingLink:changed = false',
    '@request.body.roomNumber:changed = false',
    '((student = "" && @request.body.student = @request.auth.id) || (student = @request.auth.id && @request.body.student = ""))',
  ].join(' && ');

  return {
    sprints: {
      listRule: member('cohort'), viewRule: member('cohort'),
      createRule: teacher('@request.body.cohort'), updateRule: teacher('cohort'), deleteRule: teacher('cohort'),
    },
    classes: {
      listRule: member('sprint.cohort'), viewRule: member('sprint.cohort'),
      createRule: teacher('@request.body.sprint.cohort'), updateRule: teacher('sprint.cohort'), deleteRule: teacher('sprint.cohort'),
    },
    assignments: {
      listRule: member('sprint.cohort'), viewRule: member('sprint.cohort'),
      createRule: teacher('@request.body.sprint.cohort'), updateRule: teacher('sprint.cohort'), deleteRule: teacher('sprint.cohort'),
    },
    links: {
      listRule: `(${admin} || ${eitherContext('class.sprint.cohort', 'assignment.sprint.cohort', activeMember)})`,
      viewRule: `(${admin} || ${eitherContext('class.sprint.cohort', 'assignment.sprint.cohort', activeMember)})`,
      createRule: `(${admin} || ${eitherContext('@request.body.class.sprint.cohort', '@request.body.assignment.sprint.cohort', activeTeacher)})`,
      updateRule: `(${admin} || ${eitherContext('class.sprint.cohort', 'assignment.sprint.cohort', activeTeacher)})`,
      deleteRule: `(${admin} || ${eitherContext('class.sprint.cohort', 'assignment.sprint.cohort', activeTeacher)})`,
    },
    deliveries: {
      listRule: `(${teacher('assignment.sprint.cohort')} || (${activeMember('assignment.sprint.cohort')} && student = @request.auth.id))`,
      viewRule: `(${teacher('assignment.sprint.cohort')} || (${activeMember('assignment.sprint.cohort')} && student = @request.auth.id))`,
      createRule: `(${admin} || (@request.auth.role = "estudiante" && ${activeMember('@request.body.assignment.sprint.cohort')} && @request.body.student = @request.auth.id))`,
      updateRule: `(${admin} || (@request.auth.role = "estudiante" && ${activeMember('assignment.sprint.cohort')} && student = @request.auth.id && @request.body.assignment:changed = false && @request.body.student:changed = false))`,
      deleteRule: admin,
    },
    reviews: {
      listRule: member('sprint.cohort'), viewRule: member('sprint.cohort'),
      createRule: teacher('@request.body.sprint.cohort'),
      updateRule: `(${teacher('sprint.cohort')} || (${studentReviewUpdate}))`,
      deleteRule: teacher('sprint.cohort'),
    },
    review_private_notes: {
      listRule: teacher('review.sprint.cohort'), viewRule: teacher('review.sprint.cohort'),
      createRule: teacher('@request.body.review.sprint.cohort'), updateRule: teacher('review.sprint.cohort'), deleteRule: teacher('review.sprint.cohort'),
    },
    inquiries: {
      listRule: member('cohort'), viewRule: member('cohort'),
      createRule: member('@request.body.cohort'),
      updateRule: `(${teacher('cohort')} || (${activeMember('cohort')} && author = @request.auth.id && @request.body.author:changed = false && @request.body.cohort:changed = false))`,
      deleteRule: `(${teacher('cohort')} || (${activeMember('cohort')} && author = @request.auth.id))`,
    },
    inquiry_responses: {
      listRule: member('inquiry.cohort'), viewRule: member('inquiry.cohort'),
      createRule: `(${activeMember('@request.body.inquiry.cohort')} && @request.body.author = @request.auth.id)`,
      updateRule: `(${admin} || (${activeMember('inquiry.cohort')} && author = @request.auth.id && @request.body.author:changed = false && @request.body.inquiry:changed = false))`,
      deleteRule: `(${teacher('inquiry.cohort')} || (${activeMember('inquiry.cohort')} && author = @request.auth.id))`,
    },
  };
}

async function assertBackfillComplete(pb: PocketBase) {
  for (const name of ["sprints", "inquiries"] as const) {
    const result = await pb.collection(name).getList(1, 1, { filter: 'cohort = ""', requestKey: null });
    if (result.totalItems > 0) throw new Error(`Cannot finalize ${name}: ${result.totalItems} records have no cohort.`);
  }
}

function requiredCohortField(collection: CollectionModel) {
  return collection.fields.map((field) => field.name === "cohort" ? { ...field, required: true } : field);
}

export async function ensureFinalCohortSchema(pb: PocketBase, apply: boolean) {
  await assertBackfillComplete(pb);
  const changes: Array<{ collection: string; changes: string[] }> = [];
  const reviews = await pb.collections.getOne("reviews");
  const privateNoteField = reviews.fields.find((field) => field.name === "private_note");
  if (privateNoteField) {
    const [reviewRecords, privateNotes] = await Promise.all([
      pb.collection("reviews").getFullList({ fields: "id,private_note", requestKey: null }),
      pb.collection("review_private_notes").getFullList({ requestKey: null }),
    ]);
    const existingByReview = new Map(privateNotes.map((note) => [String(note.review), note]));
    const notesToMove = reviewRecords.filter((review) => typeof review.private_note === "string" && review.private_note.trim() !== "");
    changes.push({ collection: "reviews", changes: [`move ${notesToMove.length} private notes`, "remove private_note"] });
    if (apply) {
      for (const review of notesToMove) {
        const existing = existingByReview.get(review.id);
        if (existing) await pb.collection("review_private_notes").update(existing.id, { content: review.private_note });
        else await pb.collection("review_private_notes").create({ review: review.id, content: review.private_note });
      }
      const storedNotes = await pb.collection("review_private_notes").getFullList({ requestKey: null });
      const storedReviewIds = new Set(storedNotes.map((note) => String(note.review)));
      const missing = notesToMove.filter((review) => !storedReviewIds.has(review.id));
      if (missing.length) throw new Error(`Cannot remove reviews.private_note: ${missing.length} notes were not copied.`);
      await pb.collections.update(reviews.id, { fields: reviews.fields.filter((field) => field.name !== "private_note") });
    }
  }
  for (const [name, rules] of Object.entries(finalEducationalRules())) {
    const collection = await pb.collections.getOne(name);
    const changedRules = Object.entries(rules).filter(([key, value]) => collection[key as keyof CollectionModel] !== value);
    if (!changedRules.length) continue;
    changes.push({ collection: name, changes: changedRules.map(([key]) => key) });
    if (apply) await pb.collections.update(collection.id, rules);
  }

  for (const name of ["sprints", "inquiries"] as const) {
    const collection = await pb.collections.getOne(name);
    const cohortField = collection.fields.find((field) => field.name === "cohort");
    if (!cohortField) throw new Error(`${name}.cohort is missing.`);
    const index = `CREATE INDEX \`idx_${name}_cohort\` ON \`${name}\` (\`cohort\`)`;
    const fieldsChanged = !cohortField.required;
    const indexChanged = !collection.indexes.includes(index);
    if (!fieldsChanged && !indexChanged) continue;
    changes.push({ collection: name, changes: [...(fieldsChanged ? ["cohort.required"] : []), ...(indexChanged ? ["cohort.index"] : [])] });
    if (apply) {
      await pb.collections.update(collection.id, {
        fields: requiredCohortField(collection),
        indexes: Array.from(new Set([...collection.indexes, index])),
      });
    }
  }
  return changes;
}
