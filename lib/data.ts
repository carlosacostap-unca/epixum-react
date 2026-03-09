import { createServerClient } from './pocketbase-server';
import { Sprint, Class, Link, Assignment, User, Delivery, Review } from '@/types';
import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import PocketBase from 'pocketbase';
import { cookies } from 'next/headers';

// Helper to create client with token for cached functions
const createClientWithToken = (token: string | undefined) => {
    const url = process.env['NEXT_PUBLIC_POCKETBASE_URL'];
    if (!url) {
        console.error("CRITICAL ERROR: NEXT_PUBLIC_POCKETBASE_URL is not set");
    }
    const pb = new PocketBase(url);
    // Disable autoCancellation to avoid issues in cached context
    pb.autoCancellation(false);
    if (token) {
        pb.authStore.loadFromCookie(`pb_auth=${token}`);
    }
    return pb;
};

// Cached fetchers using unstable_cache (Data Cache)
// Caches results per user (token) for a short duration to prevent 429 errors
const getSprintsCached = unstable_cache(
    async (token: string | undefined) => {
        const pb = createClientWithToken(token);
        const result = await pb.collection('sprints').getList<Sprint>(1, 50, {
            sort: 'created',
        });
        return result.items;
    },
    ['sprints-list'],
    { revalidate: 30, tags: ['sprints'] }
);

const getUsersCached = unstable_cache(
    async (token: string | undefined) => {
        const pb = createClientWithToken(token);
        return await pb.collection('users').getFullList<User>({
            sort: 'created',
        });
    },
    ['users-list'],
    { revalidate: 60, tags: ['users'] }
);

const getStudentsCached = unstable_cache(
    async (token: string | undefined) => {
        const pb = createClientWithToken(token);
        return await pb.collection('users').getFullList<User>({
            filter: 'role = "estudiante"',
            sort: 'name',
        });
    },
    ['students-list'],
    { revalidate: 60, tags: ['users'] }
);

// Exported functions with request memoization (React.cache)

export const getReviews = cache(async (sprintId: string) => {
  const pb = await createServerClient();
  try {
    const records = await pb.collection('reviews').getFullList<Review>({
      filter: `sprint = "${sprintId}"`,
      sort: 'startTime',
      expand: 'teacher,student',
    });
    return records;
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
});

export const getUserReview = cache(async (sprintId: string, userId: string) => {
  const pb = await createServerClient();
  try {
    const record = await pb.collection('reviews').getFirstListItem<Review>(
      `sprint = "${sprintId}" && student = "${userId}"`,
      { expand: 'teacher,student' }
    );
    return record;
  } catch (error) {
    return null;
  }
});

export const getUserReviews = cache(async (userId: string) => {
  const pb = await createServerClient();
  try {
    const records = await pb.collection('reviews').getFullList<Review>({
      filter: `student = "${userId}"`,
      sort: '-created',
    });
    return records;
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    return [];
  }
});

export const getSprints = cache(async () => {
    const cookieStore = await cookies();
    const token = cookieStore.get('pb_auth')?.value;
    try {
        return await getSprintsCached(token);
    } catch (error) {
        console.error('Error fetching sprints:', error);
        throw error;
    }
});

export const getUsers = cache(async () => {
    const cookieStore = await cookies();
    const token = cookieStore.get('pb_auth')?.value;
    return getUsersCached(token);
});

export const getStudents = cache(async () => {
    const cookieStore = await cookies();
    const token = cookieStore.get('pb_auth')?.value;
    return getStudentsCached(token);
});

export const getSprint = cache(async (id: string) => {
  const pb = await createServerClient();
  try {
    const record = await pb.collection('sprints').getOne<Sprint>(id, {
        expand: 'classes',
    });
    return record;
  } catch (error) {
    console.error('Error fetching sprint:', error);
    return null;
  }
});

export async function getAllClasses() {
    const pb = await createServerClient();
    const records = await pb.collection('classes').getFullList<Class>({
        sort: 'created',
        expand: 'sprint',
    });
    return records;
}

export async function getClasses(sprintId: string) {
    const pb = await createServerClient();
    const records = await pb.collection('classes').getFullList<Class>({
        filter: `sprint = "${sprintId}"`,
        sort: 'created',
    });
    return records;
}

export async function getClass(id: string) {
  const pb = await createServerClient();
  const record = await pb.collection('classes').getOne<Class>(id);
  return record;
}

export async function getAllAssignments() {
  const pb = await createServerClient();
  const records = await pb.collection('assignments').getFullList<Assignment>({
      sort: 'created',
      expand: 'sprint',
  });
  return records;
}

export async function getAssignments(sprintId: string) {
  const pb = await createServerClient();
  const records = await pb.collection('assignments').getFullList<Assignment>({
      filter: `sprint = "${sprintId}"`,
      sort: 'created',
  });
  return records;
}

export async function getAssignment(id: string) {
  const pb = await createServerClient();
  const record = await pb.collection('assignments').getOne<Assignment>(id);
  return record;
}

export async function getLinks(parentId: string, parentType: 'class' | 'assignment' = 'class') {
  const pb = await createServerClient();
  const records = await pb.collection('links').getFullList<Link>({
      filter: `${parentType} = "${parentId}"`,
      sort: 'created',
  });
  return records;
}

export async function getDeliveries(assignmentId: string) {
  const pb = await createServerClient();
  try {
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
  const pb = await createServerClient();
  try {
    const record = await pb.collection('deliveries').getFirstListItem<Delivery>(
        `assignment = "${assignmentId}" && student = "${userId}"`
    );
    return record;
  } catch (error) {
    // It's normal to not have a delivery yet
    return null;
  }
}
