import assert from 'node:assert/strict';
import test from 'node:test';
import { assertEnrollmentCompatibility, assertLifecycleTransition, isEnrollmentCompatible, parseCohortInput } from './cohort-admin-policy';

test('cohort period rejects an end date before the start date', () => {
  const form = new FormData();
  form.set('course', 'course-id');
  form.set('name', 'Cohorte nueva');
  form.set('startDate', '2026-08-10');
  form.set('endDate', '2026-08-01');
  assert.throws(() => parseCohortInput(form), /fecha final/i);
});

test('student and teacher enrollments require compatible global roles', () => {
  assert.doesNotThrow(() => assertEnrollmentCompatibility('estudiante', 'student'));
  assert.doesNotThrow(() => assertEnrollmentCompatibility('docente', 'teacher'));
  assert.throws(() => assertEnrollmentCompatibility('estudiante', 'teacher'), /no es compatible/i);
  assert.throws(() => assertEnrollmentCompatibility('docente', 'student'), /no es compatible/i);
  assert.equal(isEnrollmentCompatible('estudiante', 'teacher'), false);
});

test('only an administrator can reactivate an archived cohort', () => {
  assert.throws(() => assertLifecycleTransition('docente', 'archived', 'planned'), /administrador/i);
  assert.doesNotThrow(() => assertLifecycleTransition('admin', 'archived', 'planned'));
});

test('a teacher can activate or archive an assigned non-archived cohort', () => {
  assert.doesNotThrow(() => assertLifecycleTransition('docente', 'planned', 'active'));
  assert.doesNotThrow(() => assertLifecycleTransition('docente', 'active', 'archived'));
  assert.throws(() => assertLifecycleTransition('docente', 'active', 'planned'), /no es válida/i);
});
