import type { CohortRole, LifecycleStatus, UserRole } from '@/types';

export type CourseInput = { name: string; description: string };
export type CohortInput = { course: string; name: string; startDate: string; endDate: string };

export function parseCourseInput(formData: FormData): CourseInput {
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  if (!name) throw new Error('El nombre del curso es obligatorio.');
  if (name.length > 200) throw new Error('El nombre del curso es demasiado largo.');
  if (description.length > 5000) throw new Error('La descripción es demasiado larga.');
  return { name, description };
}

export function parseCohortInput(formData: FormData): CohortInput {
  const course = String(formData.get('course') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  const startDate = String(formData.get('startDate') ?? '').trim();
  const endDate = String(formData.get('endDate') ?? '').trim();
  if (!course || !name || !startDate || !endDate) throw new Error('Curso, nombre y período son obligatorios.');
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);
  if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf())) throw new Error('El período de la cohorte no es válido.');
  if (end < start) throw new Error('La fecha final no puede ser anterior a la inicial.');
  return { course, name, startDate: start.toISOString(), endDate: end.toISOString() };
}

export function assertEnrollmentCompatibility(userRole: UserRole, cohortRole: CohortRole) {
  if (!isEnrollmentCompatible(userRole, cohortRole)) throw new Error('El rol global del usuario no es compatible con la inscripción.');
}

export function isEnrollmentCompatible(userRole: UserRole, cohortRole: CohortRole) {
  return (userRole === 'estudiante' && cohortRole === 'student')
    || (userRole === 'docente' && cohortRole === 'teacher');
}

export function assertLifecycleTransition(actorRole: UserRole, current: LifecycleStatus, next: LifecycleStatus) {
  if (current === next) return;
  if (current === 'archived' && actorRole !== 'admin') {
    throw new Error('Solo un administrador puede reactivar una cohorte archivada.');
  }
  const allowed = current === 'planned'
    ? next === 'active' || next === 'archived'
    : current === 'active'
      ? next === 'archived'
      : next === 'planned' || next === 'active';
  if (!allowed) throw new Error('La transición de estado no es válida.');
}
