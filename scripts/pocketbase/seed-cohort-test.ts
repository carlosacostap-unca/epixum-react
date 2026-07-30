import { ClientResponseError } from "pocketbase";
import type PocketBase from "pocketbase";
import { createAdminClient, formatError, stableJson } from "./lib";

type Field = Record<string, unknown> & { name: string; type: string };

async function collectionOrNull(pb: PocketBase, name: string) {
  try {
    return await pb.collections.getOne(name);
  } catch (error) {
    if (error instanceof ClientResponseError && error.status === 404) return null;
    throw error;
  }
}

async function ensureBaseCollection(pb: PocketBase, name: string, fields: Field[]) {
  const existing = await collectionOrNull(pb, name);
  if (existing) return existing;
  return pb.collections.create({
    name,
    type: "base",
    fields: [
      ...fields,
      { name: "created", type: "autodate", onCreate: true, onUpdate: false },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ],
  });
}

async function ensureRecord(pb: PocketBase, collection: string, field: string, value: string, data: Record<string, unknown>) {
  const records = await pb.collection(collection).getFullList({ requestKey: null });
  const existing = records.find((record) => record[field] === value);
  return existing ?? pb.collection(collection).create(data);
}

function relation(name: string, collectionId: string, required = true): Field {
  return { name, type: "relation", collectionId, maxSelect: 1, required, cascadeDelete: false };
}

async function main() {
  if (process.env.POCKETBASE_TEST_SEED_APPROVED !== "true") {
    throw new Error("Test seed requires POCKETBASE_TEST_SEED_APPROVED=true.");
  }
  const pb = await createAdminClient();
  const target = new URL(pb.baseURL).hostname;
  if (target !== "127.0.0.1" && target !== "localhost") {
    throw new Error(`Refusing to seed a non-local PocketBase target: ${target}`);
  }

  const existingUsers = await collectionOrNull(pb, "users");
  let users = existingUsers ?? await pb.collections.create({
      name: "users",
      type: "auth",
      listRule: '@request.auth.role = "admin" || @request.auth.role = "docente"',
      viewRule: 'id = @request.auth.id || @request.auth.role = "admin" || @request.auth.role = "docente"',
      fields: [
        { name: "name", type: "text", required: true, max: 200 },
        { name: "role", type: "select", required: true, maxSelect: 1, values: ["admin", "docente", "estudiante"] },
      ],
      passwordAuth: { enabled: true, identityFields: ["email"] },
    });
  if (!users) throw new Error("PocketBase did not return the users collection.");
  if (!(users.fields as Array<{ name: string }>).some((field) => field.name === "role")) {
    users = await pb.collections.update(users.id, {
      fields: [
        ...users.fields,
        { name: "role", type: "select", required: true, maxSelect: 1, values: ["admin", "docente", "estudiante"] },
      ],
    });
    if (!users) throw new Error("PocketBase did not return the updated users collection.");
  }
  if (users.listRule !== '@request.auth.role = "admin" || @request.auth.role = "docente"' ||
      users.viewRule !== 'id = @request.auth.id || @request.auth.role = "admin" || @request.auth.role = "docente"') {
    users = await pb.collections.update(users.id, {
      listRule: '@request.auth.role = "admin" || @request.auth.role = "docente"',
      viewRule: 'id = @request.auth.id || @request.auth.role = "admin" || @request.auth.role = "docente"',
    });
    if (!users) throw new Error("PocketBase did not return the users collection after updating its rules.");
  }

  const sprints = await ensureBaseCollection(pb, "sprints", [
    { name: "title", type: "text", required: true },
    { name: "description", type: "text" },
    { name: "startDate", type: "date", required: true },
    { name: "endDate", type: "date", required: true },
  ]);
  const classes = await ensureBaseCollection(pb, "classes", [
    { name: "title", type: "text", required: true },
    { name: "description", type: "text" },
    relation("sprint", sprints.id),
    { name: "date", type: "date" },
  ]);
  const assignments = await ensureBaseCollection(pb, "assignments", [
    { name: "title", type: "text", required: true },
    { name: "description", type: "editor" },
    relation("sprint", sprints.id),
  ]);
  await ensureBaseCollection(pb, "links", [
    { name: "title", type: "text", required: true },
    { name: "url", type: "url", required: true },
    relation("class", classes.id, false),
    relation("assignment", assignments.id, false),
  ]);
  await ensureBaseCollection(pb, "deliveries", [
    relation("assignment", assignments.id),
    relation("student", users.id),
    { name: "repositoryUrl", type: "text", required: true },
  ]);
  await ensureBaseCollection(pb, "reviews", [
    relation("sprint", sprints.id),
    relation("teacher", users.id, false),
    relation("student", users.id, false),
    { name: "startTime", type: "date", required: true },
    { name: "endTime", type: "date", required: true },
    { name: "private_note", type: "text" },
    { name: "public_note", type: "text" },
    { name: "status", type: "select", maxSelect: 1, values: ["Aprobado", "Pendiente", "No presentÃ³", "Desaprobado"] },
    { name: "meetingLink", type: "url" },
    { name: "roomNumber", type: "text" },
  ]);
  const inquiries = await ensureBaseCollection(pb, "inquiries", [
    { name: "title", type: "text", required: true },
    { name: "description", type: "text", required: true },
    { name: "status", type: "select", maxSelect: 1, values: ["Pendiente", "Resuelta"] },
    relation("author", users.id),
    relation("class", classes.id, false),
    relation("assignment", assignments.id, false),
  ]);
  await ensureBaseCollection(pb, "inquiry_responses", [
    relation("inquiry", inquiries.id),
    relation("author", users.id),
    { name: "content", type: "text", required: true },
  ]);

  const student = await ensureRecord(pb, "users", "email", "student@test.local", {
    email: "student@test.local",
    emailVisibility: true,
    verified: true,
    password: "EpixumStudent1234!",
    passwordConfirm: "EpixumStudent1234!",
    name: "Test Student",
    role: "estudiante",
  });
  await pb.collection("users").update(student.id, { role: "estudiante" });
  const teacher = await ensureRecord(pb, "users", "email", "teacher@test.local", {
    email: "teacher@test.local",
    emailVisibility: true,
    verified: true,
    password: "EpixumTeacher1234!",
    passwordConfirm: "EpixumTeacher1234!",
    name: "Test Teacher",
    role: "docente",
  });
  await pb.collection("users").update(teacher.id, { role: "docente" });
  const administrator = await ensureRecord(pb, "users", "email", "admin@test.local", {
    email: "admin@test.local",
    emailVisibility: true,
    verified: true,
    password: "EpixumAdmin1234!",
    passwordConfirm: "EpixumAdmin1234!",
    name: "Test Admin",
    role: "admin",
  });
  await pb.collection("users").update(administrator.id, { role: "admin" });
  const sprint = await ensureRecord(pb, "sprints", "title", "Sprint histórico", {
    title: "Sprint histórico",
    description: "Registro previo a cohortes",
    startDate: "2025-03-01 00:00:00.000Z",
    endDate: "2025-04-01 00:00:00.000Z",
  });
  const classRecord = await ensureRecord(pb, "classes", "title", "Clase histórica", {
    title: "Clase histórica",
    description: "Clase previa a cohortes",
    sprint: sprint.id,
    date: "2025-03-05 00:00:00.000Z",
  });
  const assignment = await ensureRecord(pb, "assignments", "title", "Trabajo histórico", {
    title: "Trabajo histórico",
    description: "Trabajo previo a cohortes",
    sprint: sprint.id,
  });
  await ensureRecord(pb, "inquiries", "title", "Consulta por clase", {
    title: "Consulta por clase",
    description: "Debe derivar la cohorte desde la clase",
    status: "Pendiente",
    author: student.id,
    class: classRecord.id,
  });
  await ensureRecord(pb, "inquiries", "title", "Consulta por trabajo", {
    title: "Consulta por trabajo",
    description: "Debe derivar la cohorte desde el trabajo",
    status: "Pendiente",
    author: student.id,
    assignment: assignment.id,
  });
  await ensureRecord(pb, "inquiries", "title", "Consulta sin contexto", {
    title: "Consulta sin contexto",
    description: "Debe usar la cohorte inicial como fallback",
    status: "Pendiente",
    author: student.id,
  });

  console.log(stableJson({ target: new URL(pb.baseURL).origin, seeded: true }));
}

main().catch((error) => {
  console.error(formatError(error));
  process.exit(1);
});
