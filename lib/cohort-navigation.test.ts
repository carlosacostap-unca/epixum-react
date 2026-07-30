import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canonicalCohortPath,
  cohortIdFromPath,
  equivalentCohortDestination,
  selectPreferredCohort,
  selectableCohorts,
  type NavigableCohort,
} from './cohort-navigation';

const active = (id: string): NavigableCohort => ({ id, status: 'active' });
const planned = (id: string): NavigableCohort => ({ id, status: 'planned' });
const archived = (id: string): NavigableCohort => ({ id, status: 'archived' });

test('one accessible cohort is selected automatically', () => {
  assert.equal(selectPreferredCohort([active('cohort-a')])?.id, 'cohort-a');
});

test('a valid remembered cohort wins when multiple cohorts are accessible', () => {
  assert.equal(selectPreferredCohort([active('cohort-a'), planned('cohort-b')], 'cohort-b')?.id, 'cohort-b');
});

test('an inactive enrollment cannot be restored from the cookie', () => {
  const accessibleCohorts = [active('cohort-a')]; // cohort-b was removed by the active-enrollment query
  assert.equal(selectPreferredCohort(accessibleCohorts, 'cohort-b')?.id, 'cohort-a');
});

test('an archived cohort is not an active navigation choice', () => {
  assert.deepEqual(selectableCohorts([archived('old'), active('current')]).map(({ id }) => id), ['current']);
  assert.equal(selectPreferredCohort([archived('old'), active('current')], 'old')?.id, 'current');
  assert.equal(selectPreferredCohort([archived('old')], 'old'), null);
});

test('a stale cookie falls back to the first active accessible cohort', () => {
  assert.equal(selectPreferredCohort([planned('planned'), active('active')], 'missing')?.id, 'active');
});

test('switching cohorts preserves the equivalent list destination', () => {
  assert.equal(equivalentCohortDestination('/cohorts/old/reviews', 'new'), '/cohorts/new/reviews');
  assert.equal(equivalentCohortDestination('/inquiries', 'new'), '/cohorts/new/inquiries');
  assert.equal(equivalentCohortDestination('/profile', 'new'), '/cohorts/new/sprints');
});

test('explicit URLs keep multiple browser tabs independent from the preference cookie', () => {
  const remembered = 'cohort-b';
  const tabA = canonicalCohortPath('cohort-a', 'sprints');
  const tabB = canonicalCohortPath('cohort-b', 'sprints');
  assert.equal(cohortIdFromPath(tabA), 'cohort-a');
  assert.equal(cohortIdFromPath(tabB), remembered);
});
