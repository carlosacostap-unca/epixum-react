'use server';

import type { Cohort, CohortRole, Enrollment, LifecycleStatus, User } from '@/types';
import { revalidatePath } from 'next/cache';
import { revalidateCohort } from './cohort-cache';
import { requireCohortPermission, resolveCohortContext } from './cohort-context';
import {
  assertEnrollmentCompatibility,
  assertLifecycleTransition,
  parseCohortInput,
  parseCourseInput,
} from './cohort-admin-policy';
import { errorMessage } from './errors';
import { createPrivilegedServerClient, createServerClient } from './pocketbase-server';

export type AdminActionResult = { success: true; id?: string } | { success: false; error: string };

async function authenticatedActor() {
  const pb = await createServerClient();
  if (!pb.authStore.isValid || !pb.authStore.model?.id) throw new Error('No autorizado.');
  const user = await pb.collection('users').getOne<User>(pb.authStore.model.id);
  return { pb, user };
}

async function adminActor() {
  const actor = await authenticatedActor();
  if (actor.user.role !== 'admin') throw new Error('Esta acción requiere rol administrador.');
  return actor;
}

function refreshAdministration(cohortId?: string) {
  revalidatePath('/');
  revalidatePath('/cohorts');
  revalidatePath('/admin/courses');
  if (cohortId) {
    revalidateCohort(cohortId, 'participants', 'students');
    revalidatePath(`/cohorts/${cohortId}/manage`);
    revalidatePath(`/cohorts/${cohortId}/students`);
  }
}

export async function createCourse(formData: FormData): Promise<AdminActionResult> {
  try {
    const { pb } = await adminActor();
    const input = parseCourseInput(formData);
    const course = await pb.collection('courses').create({ ...input, status: 'active' });
    refreshAdministration();
    return { success: true, id: course.id };
  } catch (error) {
    return { success: false, error: errorMessage(error, 'No se pudo crear el curso.') };
  }
}

export async function updateCourse(courseId: string, formData: FormData): Promise<AdminActionResult> {
  try {
    const { pb } = await adminActor();
    const input = parseCourseInput(formData);
    await pb.collection('courses').update(courseId, input);
    refreshAdministration();
    return { success: true, id: courseId };
  } catch (error) {
    return { success: false, error: errorMessage(error, 'No se pudo actualizar el curso.') };
  }
}

export async function setCourseStatus(courseId: string, status: 'active' | 'archived'): Promise<AdminActionResult> {
  try {
    const { pb } = await adminActor();
    await pb.collection('courses').update(courseId, { status });
    refreshAdministration();
    return { success: true, id: courseId };
  } catch (error) {
    return { success: false, error: errorMessage(error, 'No se pudo cambiar el estado del curso.') };
  }
}

export async function createCohort(formData: FormData): Promise<AdminActionResult> {
  let createdId: string | null = null;
  let privilegedPb: Awaited<ReturnType<typeof createPrivilegedServerClient>> | null = null;
  try {
    const { pb, user } = await authenticatedActor();
    if (user.role !== 'admin' && user.role !== 'docente') throw new Error('No autorizado para crear cohortes.');
    const input = parseCohortInput(formData);
    if (user.role === 'docente') privilegedPb = await createPrivilegedServerClient();
    const cohort = await pb.collection('cohorts').create<Cohort>({ ...input, status: 'planned' });
    createdId = cohort.id;
    if (user.role === 'docente') {
      await privilegedPb!.collection('enrollments').create({ cohort: cohort.id, user: user.id, role: 'teacher', status: 'active' });
    }
    refreshAdministration(cohort.id);
    return { success: true, id: cohort.id };
  } catch (error) {
    if (createdId && privilegedPb) {
      try { await privilegedPb.collection('cohorts').delete(createdId); } catch (rollbackError) { console.error('Failed to rollback cohort creation', rollbackError); }
    }
    return { success: false, error: errorMessage(error, 'No se pudo crear la cohorte.') };
  }
}

export async function updateCohort(cohortId: string, formData: FormData): Promise<AdminActionResult> {
  try {
    const context = await resolveCohortContext(cohortId);
    requireCohortPermission(context, 'manage-cohort');
    if (context.cohort.status === 'archived') throw new Error('Reactivá la cohorte antes de editarla.');
    const input = parseCohortInput(formData);
    const pb = await createServerClient();
    await pb.collection('cohorts').update(cohortId, input);
    refreshAdministration(cohortId);
    return { success: true, id: cohortId };
  } catch (error) {
    return { success: false, error: errorMessage(error, 'No se pudo actualizar la cohorte.') };
  }
}

export async function setCohortStatus(cohortId: string, status: LifecycleStatus): Promise<AdminActionResult> {
  try {
    const context = await resolveCohortContext(cohortId);
    requireCohortPermission(context, 'manage-cohort');
    assertLifecycleTransition(context.user.role, context.cohort.status, status);
    const pb = await createServerClient();
    await pb.collection('cohorts').update(cohortId, { status });
    refreshAdministration(cohortId);
    return { success: true, id: cohortId };
  } catch (error) {
    return { success: false, error: errorMessage(error, 'No se pudo cambiar el estado de la cohorte.') };
  }
}

export async function upsertEnrollment(cohortId: string, userId: string, role: CohortRole): Promise<AdminActionResult> {
  try {
    const context = await resolveCohortContext(cohortId);
    requireCohortPermission(context, role === 'teacher' ? 'manage-teachers' : 'manage-students');
    if (context.cohort.status === 'archived') throw new Error('Una cohorte archivada es de solo lectura.');
    const pb = await createServerClient();
    const targetUser = await pb.collection('users').getOne<User>(userId);
    assertEnrollmentCompatibility(targetUser.role, role);
    let enrollment: Enrollment | null = null;
    try {
      enrollment = await pb.collection('enrollments').getFirstListItem<Enrollment>(
        pb.filter('cohort = {:cohort} && user = {:user}', { cohort: cohortId, user: userId }),
      );
    } catch {
      enrollment = null;
    }
    const saved = enrollment
      ? await pb.collection('enrollments').update<Enrollment>(enrollment.id, { role, status: 'active' })
      : await pb.collection('enrollments').create<Enrollment>({ cohort: cohortId, user: userId, role, status: 'active' });
    refreshAdministration(cohortId);
    return { success: true, id: saved.id };
  } catch (error) {
    return { success: false, error: errorMessage(error, 'No se pudo guardar la inscripción.') };
  }
}

export async function setEnrollmentStatus(enrollmentId: string, status: 'active' | 'inactive'): Promise<AdminActionResult> {
  try {
    const pb = await createServerClient();
    const enrollment = await pb.collection('enrollments').getOne<Enrollment>(enrollmentId, { expand: 'user' });
    const context = await resolveCohortContext(enrollment.cohort, pb);
    requireCohortPermission(context, enrollment.role === 'teacher' ? 'manage-teachers' : 'manage-students');
    if (context.cohort.status === 'archived') throw new Error('Una cohorte archivada es de solo lectura.');
    const targetUser = enrollment.expand?.user ?? await pb.collection('users').getOne<User>(enrollment.user);
    assertEnrollmentCompatibility(targetUser.role, enrollment.role);
    await pb.collection('enrollments').update(enrollmentId, { status });
    refreshAdministration(enrollment.cohort);
    return { success: true, id: enrollmentId };
  } catch (error) {
    return { success: false, error: errorMessage(error, 'No se pudo cambiar la inscripción.') };
  }
}
