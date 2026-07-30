import assert from "node:assert/strict";
import PocketBase from "pocketbase";
import { createAdminClient, formatError, stableJson } from "./lib";

type CaseResult = { name: string; passed: boolean };

async function firstBy(pb: PocketBase, collection: string, field: string, value: string) {
  const records = await pb.collection(collection).getFullList({ requestKey: null });
  return records.find((record) => record[field] === value) ?? null;
}

async function ensureRecord(pb: PocketBase, collection: string, field: string, value: string, data: Record<string, unknown>) {
  return await firstBy(pb, collection, field, value) ?? pb.collection(collection).create(data);
}

async function ensureEnrollment(pb: PocketBase, cohort: string, user: string, role: "student" | "teacher", status: "active" | "inactive") {
  const records = await pb.collection("enrollments").getFullList({ requestKey: null });
  const existing = records.find((record) => record.cohort === cohort && record.user === user);
  return existing
    ? pb.collection("enrollments").update(existing.id, { role, status })
    : pb.collection("enrollments").create({ cohort, user, role, status });
}

async function userClient(url: string, email: string, password: string) {
  const pb = new PocketBase(url);
  pb.autoCancellation(false);
  await pb.collection("users").authWithPassword(email, password);
  return pb;
}

async function expectDenied(action: () => Promise<unknown>) {
  try {
    await action();
    assert.fail("Expected PocketBase to deny the operation");
  } catch (error) {
    if (error instanceof assert.AssertionError) throw error;
  }
}

async function main() {
  const adminPb = await createAdminClient();
  const hostname = new URL(adminPb.baseURL).hostname;
  if (hostname !== "127.0.0.1" && hostname !== "localhost") throw new Error("Permission matrix only runs against localhost.");

  const course = await firstBy(adminPb, "courses", "name", "React");
  const cohortA = await firstBy(adminPb, "cohorts", "name", "Cohorte inicial");
  assert(course && cohortA);
  const cohortB = await ensureRecord(adminPb, "cohorts", "name", "Cohorte aislada", {
    course: course.id, name: "Cohorte aislada", startDate: "2026-01-01 00:00:00.000Z", endDate: "2026-06-30 00:00:00.000Z", status: "active",
  });
  const student = await firstBy(adminPb, "users", "email", "student@test.local");
  const teacher = await firstBy(adminPb, "users", "email", "teacher@test.local");
  const globalAdmin = await firstBy(adminPb, "users", "email", "admin@test.local");
  assert(student && teacher && globalAdmin);

  const additionalUsers = [
    ["student2@test.local", "Student Two", "estudiante", "EpixumStudent21234!"],
    ["inactive@test.local", "Inactive Student", "estudiante", "EpixumInactive1234!"],
    ["teacher2@test.local", "Teacher Two", "docente", "EpixumTeacher21234!"],
    ["mismatch@test.local", "Mismatch Student", "estudiante", "EpixumMismatch1234!"],
  ] as const;
  const createdUsers = [];
  for (const [email, name, role, password] of additionalUsers) {
    createdUsers.push(await ensureRecord(adminPb, "users", "email", email, {
      email, name, role, verified: true, password, passwordConfirm: password,
    }));
  }
  const [student2, inactive, teacher2, mismatch] = createdUsers;
  await Promise.all([
    ensureEnrollment(adminPb, cohortA.id, student.id, "student", "active"),
    ensureEnrollment(adminPb, cohortA.id, teacher.id, "teacher", "active"),
    ensureEnrollment(adminPb, cohortA.id, student2.id, "student", "active"),
    ensureEnrollment(adminPb, cohortA.id, inactive.id, "student", "inactive"),
    ensureEnrollment(adminPb, cohortB.id, teacher2.id, "teacher", "active"),
    ensureEnrollment(adminPb, cohortA.id, mismatch.id, "teacher", "active"),
  ]);

  const sprintA = await firstBy(adminPb, "sprints", "title", "Sprint histórico");
  assert(sprintA);
  const sprintB = await ensureRecord(adminPb, "sprints", "title", "Sprint cohorte aislada", {
    title: "Sprint cohorte aislada", description: "Frontera B", cohort: cohortB.id,
    startDate: "2026-01-01 00:00:00.000Z", endDate: "2026-02-01 00:00:00.000Z",
  });
  const classA = await firstBy(adminPb, "classes", "sprint", sprintA.id);
  const assignmentA = await firstBy(adminPb, "assignments", "sprint", sprintA.id);
  assert(classA && assignmentA);
  const classB = await ensureRecord(adminPb, "classes", "title", "Clase cohorte aislada", {
    title: "Clase cohorte aislada", description: "Solo cohorte B", sprint: sprintB.id,
  });
  const assignmentB = await ensureRecord(adminPb, "assignments", "title", "Trabajo cohorte aislada", {
    title: "Trabajo cohorte aislada", description: "Solo cohorte B", sprint: sprintB.id,
  });
  const linkB = await ensureRecord(adminPb, "links", "title", "Link cohorte aislada", {
    title: "Link cohorte aislada", url: "https://example.com/cohort-b", class: classB.id,
  });
  const inactiveDelivery = await ensureRecord(adminPb, "deliveries", "repositoryUrl", "https://example.com/inactive-history", {
    assignment: assignmentA.id, student: inactive.id, repositoryUrl: "https://example.com/inactive-history",
  });
  const deliveryB = await ensureRecord(adminPb, "deliveries", "repositoryUrl", "https://example.com/cohort-b-delivery", {
    assignment: assignmentB.id, student: student2.id, repositoryUrl: "https://example.com/cohort-b-delivery",
  });
  const availableReview = await ensureRecord(adminPb, "reviews", "roomNumber", "MATRIX-A", {
    sprint: sprintA.id, teacher: teacher.id, startTime: "2026-01-10 10:00:00.000Z", endTime: "2026-01-10 10:30:00.000Z",
    status: "Pendiente", roomNumber: "MATRIX-A",
  });
  const competingReview = await ensureRecord(adminPb, "reviews", "roomNumber", "MATRIX-A-SECOND", {
    sprint: sprintA.id, teacher: teacher.id, startTime: "2026-01-10 11:00:00.000Z", endTime: "2026-01-10 11:30:00.000Z",
    status: "Pendiente", roomNumber: "MATRIX-A-SECOND",
  });
  const reviewB = await ensureRecord(adminPb, "reviews", "roomNumber", "MATRIX-B", {
    sprint: sprintB.id, teacher: teacher2.id, startTime: "2026-01-10 10:00:00.000Z", endTime: "2026-01-10 10:30:00.000Z",
    status: "Pendiente", roomNumber: "MATRIX-B",
  });
  const inquiry = await firstBy(adminPb, "inquiries", "title", "Consulta por clase");
  assert(inquiry);
  const inquiryB = await ensureRecord(adminPb, "inquiries", "title", "Consulta cohorte aislada", {
    title: "Consulta cohorte aislada", description: "Solo cohorte B", status: "Pendiente",
    author: student2.id, cohort: cohortB.id, assignment: assignmentB.id,
  });
  const responseB = await ensureRecord(adminPb, "inquiry_responses", "content", "respuesta-secreta-cohorte-b", {
    inquiry: inquiryB.id, author: student2.id, content: "respuesta-secreta-cohorte-b",
  });
  const privateNote = await ensureRecord(adminPb, "review_private_notes", "review", availableReview.id, {
    review: availableReview.id, content: "nota-privada-matriz",
  });

  const [studentPb, student2Pb, inactivePb, teacherPb, teacher2Pb, mismatchPb, globalAdminPb] = await Promise.all([
    userClient(adminPb.baseURL, "student@test.local", "EpixumStudent1234!"),
    userClient(adminPb.baseURL, "student2@test.local", "EpixumStudent21234!"),
    userClient(adminPb.baseURL, "inactive@test.local", "EpixumInactive1234!"),
    userClient(adminPb.baseURL, "teacher@test.local", "EpixumTeacher1234!"),
    userClient(adminPb.baseURL, "teacher2@test.local", "EpixumTeacher21234!"),
    userClient(adminPb.baseURL, "mismatch@test.local", "EpixumMismatch1234!"),
    userClient(adminPb.baseURL, "admin@test.local", "EpixumAdmin1234!"),
  ]);

  const cases: CaseResult[] = [];
  async function check(name: string, action: () => Promise<void>) {
    await action();
    cases.push({ name, passed: true });
  }

  await check("administrator reads every cohort without enrollment", async () => {
    const records = await globalAdminPb.collection("sprints").getFullList();
    assert(records.some((record) => record.id === sprintA.id));
    assert(records.some((record) => record.id === sprintB.id));
  });
  await check("active student reads own cohort and not another cohort", async () => {
    const visible = await studentPb.collection("sprints").getFullList({ filter: `cohort = "${cohortA.id}"` });
    assert(visible.some((record) => record.id === sprintA.id));
    assert.equal(visible.some((record) => record.id === sprintB.id), false);
    await expectDenied(() => studentPb.collection("sprints").getOne(sprintB.id));
  });
  await check("inactive enrollment cannot read cohort", async () => {
    assert.equal((await inactivePb.collection("sprints").getFullList()).length, 0);
    await expectDenied(() => inactivePb.collection("sprints").getOne(sprintA.id));
  });
  await check("assigned teacher manages own cohort", async () => {
    const record = await teacherPb.collection("reviews").create({
      sprint: sprintA.id, teacher: teacher.id, startTime: "2026-01-11 10:00:00.000Z", endTime: "2026-01-11 10:30:00.000Z", status: "Pendiente",
    });
    await teacherPb.collection("reviews").delete(record.id);
  });
  await check("unrelated teacher cannot manage another cohort", async () => {
    await expectDenied(() => teacher2Pb.collection("reviews").create({
      sprint: sprintA.id, teacher: teacher2.id, startTime: "2026-01-12 10:00:00.000Z", endTime: "2026-01-12 10:30:00.000Z", status: "Pendiente",
    }));
  });
  await check("student global role cannot use teacher enrollment", async () => {
    await expectDenied(() => mismatchPb.collection("reviews").create({
      sprint: sprintA.id, teacher: mismatch.id, startTime: "2026-01-13 10:00:00.000Z", endTime: "2026-01-13 10:30:00.000Z", status: "Pendiente",
    }));
  });
  await check("student can reserve and release only self", async () => {
    await studentPb.collection("reviews").update(availableReview.id, { student: student.id });
    await expectDenied(() => studentPb.collection("reviews").update(competingReview.id, { student: student.id }));
    await expectDenied(() => studentPb.collection("reviews").update(availableReview.id, { status: "Aprobado" }));
    await studentPb.collection("reviews").update(availableReview.id, { student: "" });
  });
  await check("non-owner student cannot mutate inquiry", async () => {
    await expectDenied(() => student2Pb.collection("inquiries").update(inquiry.id, { title: "Intrusión" }));
    await studentPb.collection("inquiries").update(inquiry.id, { title: inquiry.title });
  });
  await check("direct child identifiers from another cohort are denied", async () => {
    await expectDenied(() => studentPb.collection("classes").getOne(classB.id));
    await expectDenied(() => studentPb.collection("assignments").getOne(assignmentB.id));
    await expectDenied(() => studentPb.collection("links").getOne(linkB.id));
    await expectDenied(() => studentPb.collection("deliveries").getOne(deliveryB.id));
    await expectDenied(() => studentPb.collection("reviews").getOne(reviewB.id));
    await expectDenied(() => studentPb.collection("inquiries").getOne(inquiryB.id));
    await expectDenied(() => studentPb.collection("inquiry_responses").getOne(responseB.id));
  });
  await check("inactive student delivery remains historical but inaccessible to student", async () => {
    assert.equal((await teacherPb.collection("deliveries").getOne(inactiveDelivery.id)).id, inactiveDelivery.id);
    await expectDenied(() => inactivePb.collection("deliveries").getOne(inactiveDelivery.id));
  });
  await check("private review note never reaches students", async () => {
    await expectDenied(() => studentPb.collection("review_private_notes").getOne(privateNote.id));
    assert.equal((await studentPb.collection("review_private_notes").getFullList()).length, 0);
    const studentReview = await studentPb.collection("reviews").getOne(availableReview.id);
    assert.equal(Object.hasOwn(studentReview, "private_note"), false);
    assert.equal(stableJson(studentReview).includes("nota-privada-matriz"), false);
  });
  await check("response content from another cohort is absent from direct search", async () => {
    const ownResponses = await studentPb.collection("inquiry_responses").getFullList({
      filter: 'content ~ "Respuesta E2E exclusiva A"',
    });
    assert.equal(ownResponses.length, 1);
    const responses = await studentPb.collection("inquiry_responses").getFullList({
      filter: 'content ~ "respuesta-secreta-cohorte-b"',
    });
    assert.equal(responses.length, 0);
  });

  console.log(stableJson({ target: adminPb.baseURL, cases, passed: cases.length, failed: 0 }));
}

main().catch((error) => {
  console.error(formatError(error));
  process.exit(1);
});
