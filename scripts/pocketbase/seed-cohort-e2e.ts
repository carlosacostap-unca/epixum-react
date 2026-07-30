import assert from 'node:assert/strict';
import type PocketBase from 'pocketbase';
import { createAdminClient, formatError, stableJson } from './lib';

async function firstBy(pb: PocketBase, collection: string, field: string, value: string) {
  const records = await pb.collection(collection).getFullList({ requestKey: null });
  return records.find((record) => record[field] === value) ?? null;
}

async function ensureRecord(
  pb: PocketBase,
  collection: string,
  field: string,
  value: string,
  data: Record<string, unknown>,
) {
  return await firstBy(pb, collection, field, value) ?? pb.collection(collection).create(data);
}

async function ensureEnrollment(pb: PocketBase, cohort: string, user: string, role: 'student' | 'teacher') {
  const records = await pb.collection('enrollments').getFullList({ requestKey: null });
  const existing = records.find((record) => record.cohort === cohort && record.user === user);
  return existing
    ? pb.collection('enrollments').update(existing.id, { role, status: 'active' })
    : pb.collection('enrollments').create({ cohort, user, role, status: 'active' });
}

async function main() {
  if (process.env.POCKETBASE_TEST_SEED_APPROVED !== 'true') {
    throw new Error('E2E seed requires POCKETBASE_TEST_SEED_APPROVED=true.');
  }
  const pb = await createAdminClient();
  const hostname = new URL(pb.baseURL).hostname;
  if (hostname !== '127.0.0.1' && hostname !== 'localhost') {
    throw new Error(`Refusing to seed E2E fixtures on non-local target: ${hostname}`);
  }

  const course = await firstBy(pb, 'courses', 'name', 'React');
  const cohortA = await firstBy(pb, 'cohorts', 'name', 'Cohorte inicial');
  const student = await firstBy(pb, 'users', 'email', 'student@test.local');
  const teacher = await firstBy(pb, 'users', 'email', 'teacher@test.local');
  const administrator = await firstBy(pb, 'users', 'email', 'admin@test.local');
  assert(course && cohortA && student && teacher && administrator);

  const cohortB = await ensureRecord(pb, 'cohorts', 'name', 'Cohorte E2E B', {
    course: course.id,
    name: 'Cohorte E2E B',
    startDate: '2026-08-01 00:00:00.000Z',
    endDate: '2026-12-15 00:00:00.000Z',
    status: 'active',
  });
  await Promise.all([
    ensureEnrollment(pb, cohortA.id, student.id, 'student'),
    ensureEnrollment(pb, cohortA.id, teacher.id, 'teacher'),
    ensureEnrollment(pb, cohortB.id, student.id, 'student'),
    ensureEnrollment(pb, cohortB.id, teacher.id, 'teacher'),
  ]);

  const sprintA = await ensureRecord(pb, 'sprints', 'title', 'Sprint E2E Cohorte A', {
    title: 'Sprint E2E Cohorte A', description: 'Contenido exclusivo A', cohort: cohortA.id,
    startDate: '2026-03-01 00:00:00.000Z', endDate: '2026-03-31 00:00:00.000Z',
  });
  const sprintB = await ensureRecord(pb, 'sprints', 'title', 'Sprint E2E Cohorte B', {
    title: 'Sprint E2E Cohorte B', description: 'Contenido exclusivo B', cohort: cohortB.id,
    startDate: '2026-08-01 00:00:00.000Z', endDate: '2026-08-31 00:00:00.000Z',
  });
  const assignmentA = await ensureRecord(pb, 'assignments', 'title', 'TP E2E Cohorte A', {
    title: 'TP E2E Cohorte A', description: '<p>Entrega exclusiva A</p>', sprint: sprintA.id,
  });
  const assignmentB = await ensureRecord(pb, 'assignments', 'title', 'TP E2E Cohorte B', {
    title: 'TP E2E Cohorte B', description: '<p>Entrega exclusiva B</p>', sprint: sprintB.id,
  });
  await ensureRecord(pb, 'deliveries', 'repositoryUrl', 'https://github.com/epixum/e2e-a', {
    assignment: assignmentA.id, student: student.id, repositoryUrl: 'https://github.com/epixum/e2e-a',
  });
  await ensureRecord(pb, 'deliveries', 'repositoryUrl', 'https://github.com/epixum/e2e-b', {
    assignment: assignmentB.id, student: student.id, repositoryUrl: 'https://github.com/epixum/e2e-b',
  });
  await ensureRecord(pb, 'reviews', 'roomNumber', 'E2E-A', {
    sprint: sprintA.id, teacher: teacher.id, startTime: '2026-03-20 10:00:00.000Z',
    endTime: '2026-03-20 10:20:00.000Z', roomNumber: 'E2E-A', status: 'Pendiente',
  });
  await ensureRecord(pb, 'reviews', 'roomNumber', 'E2E-B', {
    sprint: sprintB.id, teacher: teacher.id, startTime: '2026-08-20 10:00:00.000Z',
    endTime: '2026-08-20 10:20:00.000Z', roomNumber: 'E2E-B', status: 'Pendiente',
  });
  const inquiryA = await ensureRecord(pb, 'inquiries', 'title', 'Consulta E2E Cohorte A', {
    title: 'Consulta E2E Cohorte A', description: 'Pregunta exclusiva A', status: 'Pendiente',
    author: student.id, cohort: cohortA.id, assignment: assignmentA.id,
  });
  const inquiryB = await ensureRecord(pb, 'inquiries', 'title', 'Consulta E2E Cohorte B', {
    title: 'Consulta E2E Cohorte B', description: 'Pregunta exclusiva B', status: 'Pendiente',
    author: student.id, cohort: cohortB.id, assignment: assignmentB.id,
  });
  await ensureRecord(pb, 'inquiry_responses', 'content', 'Respuesta E2E exclusiva A', {
    inquiry: inquiryA.id, author: teacher.id, content: 'Respuesta E2E exclusiva A',
  });
  await ensureRecord(pb, 'inquiry_responses', 'content', 'Respuesta E2E exclusiva B', {
    inquiry: inquiryB.id, author: teacher.id, content: 'Respuesta E2E exclusiva B',
  });

  console.log(stableJson({
    target: pb.baseURL,
    cohorts: { a: cohortA.id, b: cohortB.id },
    sprints: { a: sprintA.id, b: sprintB.id },
    assignments: { a: assignmentA.id, b: assignmentB.id },
    users: { student: student.id, teacher: teacher.id, administrator: administrator.id },
  }));
}

main().catch((error) => {
  console.error(formatError(error));
  process.exit(1);
});
