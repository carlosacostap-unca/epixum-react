import { createServerClient } from './pocketbase-server';
import { Sprint, Class, Link, Assignment, User, Delivery, Review, Enrollment, ReviewPrivateNote } from '@/types';
import { cache } from 'react';
import { authorizeRecord, resolveCohortContext } from './cohort-context';
import { attachPrivateReviewNotes, withoutPrivateReviewFields } from './review-privacy';

// Exported functions with request memoization (React.cache)

export const getReviews = cache(async (cohortId: string, sprintId: string) => {
  const context = await resolveCohortContext(cohortId);
  const pb = await createServerClient();
  try {
    const records = await pb.collection('reviews').getFullList<Review>({
      filter: pb.filter('sprint = {:sprint} && sprint.cohort = {:cohort}', { sprint: sprintId, cohort: cohortId }),
      sort: 'startTime',
      expand: 'teacher,student',
    });
    if (!context.permissions.has('manage-academics') || records.length === 0) {
      return records.map(withoutPrivateReviewFields);
    }
    const notes = await pb.collection('review_private_notes').getFullList<ReviewPrivateNote>({
      filter: records.map((review) => pb.filter('review = {:review}', { review: review.id })).join(' || '),
    });
    return attachPrivateReviewNotes(records, notes);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
});

export const getUserReview = cache(async (sprintId: string, userId: string) => {
  try {
    const { pb } = await authorizeRecord('sprints', sprintId);
    const record = await pb.collection('reviews').getFirstListItem<Review>(
      `sprint = "${sprintId}" && student = "${userId}"`,
      { expand: 'teacher,student' }
    );
    return withoutPrivateReviewFields(record);
  } catch {
    return null;
  }
});

export const getUserReviews = cache(async (cohortId: string, userId: string) => {
  await resolveCohortContext(cohortId);
  const pb = await createServerClient();
  try {
    const records = await pb.collection('reviews').getFullList<Review>({
      filter: pb.filter('student = {:user} && sprint.cohort = {:cohort}', { user: userId, cohort: cohortId }),
      sort: '-created',
    });
    return records.map(withoutPrivateReviewFields);
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    return [];
  }
});

export const getSprints = cache(async (cohortId: string) => {
    const pb = await createServerClient();
    await resolveCohortContext(cohortId, pb);
    try {
        return await pb.collection('sprints').getFullList<Sprint>({
            filter: `cohort = "${cohortId}"`,
            sort: 'created',
        });
    } catch (error) {
        console.error('Error fetching sprints:', error);
        throw error;
    }
});

export const getUsers = cache(async () => {
    const pb = await createServerClient();
    return pb.collection('users').getFullList<User>({ sort: 'created' });
});

export const getStudents = cache(async (cohortId: string) => {
    const pb = await createServerClient();
    await resolveCohortContext(cohortId, pb);
    const enrollments = await pb.collection('enrollments').getFullList<Enrollment>({
        filter: `cohort = "${cohortId}" && role = "student" && status = "active"`,
        expand: 'user',
    });
    return enrollments.flatMap((enrollment) => enrollment.expand?.user ? [enrollment.expand.user] : []);
});

export const getSprint = cache(async (id: string) => {
  try {
    const { pb } = await authorizeRecord('sprints', id);
    const record = await pb.collection('sprints').getOne<Sprint>(id, {
        expand: 'classes',
    });
    return record;
  } catch (error) {
    console.error('Error fetching sprint:', error);
    return null;
  }
});

export async function getAllClasses(cohortId: string) {
    await resolveCohortContext(cohortId);
    const pb = await createServerClient();
    const records = await pb.collection('classes').getFullList<Class>({
        filter: pb.filter('sprint.cohort = {:cohort}', { cohort: cohortId }),
        sort: 'created',
        expand: 'sprint',
    });
    return records;
}

export async function getClasses(sprintId: string) {
    const { pb } = await authorizeRecord('sprints', sprintId);
    const records = await pb.collection('classes').getFullList<Class>({
        filter: `sprint = "${sprintId}"`,
        sort: 'created',
    });
    return records;
}

export async function getClass(id: string) {
  const { pb } = await authorizeRecord('classes', id);
  const record = await pb.collection('classes').getOne<Class>(id);
  return record;
}

export async function getAllAssignments(cohortId: string) {
  await resolveCohortContext(cohortId);
  const pb = await createServerClient();
  const records = await pb.collection('assignments').getFullList<Assignment>({
      filter: pb.filter('sprint.cohort = {:cohort}', { cohort: cohortId }),
      sort: 'created',
      expand: 'sprint',
  });
  return records;
}

export async function getAssignments(sprintId: string) {
  const { pb } = await authorizeRecord('sprints', sprintId);
  const records = await pb.collection('assignments').getFullList<Assignment>({
      filter: `sprint = "${sprintId}"`,
      sort: 'created',
  });
  return records;
}

export async function getAssignment(id: string) {
  const { pb } = await authorizeRecord('assignments', id);
  const record = await pb.collection('assignments').getOne<Assignment>(id);
  return record;
}

export async function getLinks(parentId: string, parentType: 'class' | 'assignment' = 'class') {
  const { pb } = await authorizeRecord(parentType === 'class' ? 'classes' : 'assignments', parentId);
  const records = await pb.collection('links').getFullList<Link>({
      filter: `${parentType} = "${parentId}"`,
      sort: 'created',
  });
  return records;
}

export async function getDeliveries(assignmentId: string) {
  try {
     const { pb } = await authorizeRecord('assignments', assignmentId, 'manage-academics');
     const records = await pb.collection('deliveries').getFullList<Delivery>({
         filter: `assignment = "${assignmentId}"`,
         sort: '-created',
         expand: 'student',
     });
     
     return records;
   } catch (error) {
     console.error('Error fetching deliveries:', error);
     return [];
   }
}

export async function getUserDelivery(assignmentId: string, userId: string) {
  try {
    const { pb } = await authorizeRecord('assignments', assignmentId);
    const record = await pb.collection('deliveries').getFirstListItem<Delivery>(
        `assignment = "${assignmentId}" && student = "${userId}"`
    );
    return record;
  } catch {
    // It's normal to not have a delivery yet
    return null;
  }
}
