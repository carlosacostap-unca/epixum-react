import assert from 'node:assert/strict';
import test from 'node:test';
import { cohortCacheKey, cohortCacheTag } from './cohort-cache';

test('cohort cache identity changes when cohort changes', () => {
  assert.notDeepEqual(
    cohortCacheKey('cohort-a', 'sprints', 'user-1'),
    cohortCacheKey('cohort-b', 'sprints', 'user-1'),
  );
  assert.notEqual(cohortCacheTag('cohort-a', 'sprints'), cohortCacheTag('cohort-b', 'sprints'));
});

test('resource and user are part of the cache identity', () => {
  assert.notDeepEqual(
    cohortCacheKey('cohort-a', 'sprints', 'user-1'),
    cohortCacheKey('cohort-a', 'reviews', 'user-1'),
  );
  assert.notDeepEqual(
    cohortCacheKey('cohort-a', 'sprints', 'user-1'),
    cohortCacheKey('cohort-a', 'sprints', 'user-2'),
  );
});
