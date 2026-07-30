"use server";

import { createServerClient } from "@/lib/pocketbase-server";
import { revalidatePath } from "next/cache";
import { assertOwner, authorizeRecord, requireCohortPermission, requireWritableCohort, resolveCohortContext } from "@/lib/cohort-context";
import { revalidateCohort } from "@/lib/cohort-cache";

export async function updateUserRole(userId: string, role: string) {
  const pb = await createServerClient();
  
  // Verify current user is admin
  if (!pb.authStore.isValid || pb.authStore.model?.role !== 'admin') {
    throw new Error("Unauthorized");
  }

  try {
    await pb.collection('users').update(userId, { role });
    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    console.error('Failed to update role:', error);
    return { success: false, error: 'Failed to update role' };
  }
}

export async function createSprint(formData: FormData) {
  const cohortId = String(formData.get('cohortId') ?? '');
  const context = await resolveCohortContext(cohortId);
  requireCohortPermission(context, 'manage-academics');
  const pb = await createServerClient();

  const title = formData.get('title') as string;
  const startDate = formData.get('startDate') as string;
  const endDate = formData.get('endDate') as string;

  if (!title) {
     return { success: false, error: 'Title is required' };
  }

  try {
    const data = {
      title,
      cohort: cohortId,
      startDate: startDate ? new Date(startDate).toISOString() : null,
      endDate: endDate ? new Date(endDate).toISOString() : null,
    };
    
    await pb.collection('sprints').create(data);
    revalidateCohort(cohortId, 'sprints');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to create sprint:', error);
    return { success: false, error: 'Failed to create sprint' };
  }
}

export async function updateSprint(sprintId: string, formData: FormData) {
  const { pb, cohortId } = await authorizeRecord('sprints', sprintId, 'manage-academics');

  const title = formData.get('title') as string;
  const startDate = formData.get('startDate') as string;
  const endDate = formData.get('endDate') as string;

  try {
     const data: Record<string, string> = {
      title,
    };
    if (startDate) data.startDate = new Date(startDate).toISOString();
    if (endDate) data.endDate = new Date(endDate).toISOString();

    await pb.collection('sprints').update(sprintId, data);
    revalidateCohort(cohortId, 'sprints');
    revalidatePath('/');
    revalidatePath(`/sprints/${sprintId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to update sprint:', error);
    return { success: false, error: 'Failed to update sprint' };
  }
}

export async function deleteSprint(sprintId: string) {
  const { pb, cohortId } = await authorizeRecord('sprints', sprintId, 'manage-academics');

  try {
    await pb.collection('sprints').delete(sprintId);
    revalidateCohort(cohortId, 'sprints');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete sprint:', error);
    return { success: false, error: 'Failed to delete sprint' };
  }
}

// Classes

export async function createClass(formData: FormData) {
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const sprintId = formData.get('sprintId') as string;
  const date = formData.get('date') as string;

  if (!title || !sprintId) {
     return { success: false, error: 'Title and Sprint ID are required' };
  }

  try {
    const { pb, cohortId } = await authorizeRecord('sprints', sprintId, 'manage-academics');
    const data = {
      title,
      description,
      sprint: sprintId,
      date: date ? new Date(date).toISOString() : null,
    };
    
    await pb.collection('classes').create(data);
    revalidateCohort(cohortId, 'sprints');
    revalidatePath(`/sprints/${sprintId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to create class:', error);
    return { success: false, error: 'Failed to create class' };
  }
}

export async function updateClass(classId: string, formData: FormData) {
  const { pb, cohortId } = await authorizeRecord('classes', classId, 'manage-academics');

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const date = formData.get('date') as string;
  const sprintId = formData.get('sprintId') as string;

  try {
    const data: Record<string, string> = {
      title,
      description,
    };
    if (date) data.date = new Date(date).toISOString();

    await pb.collection('classes').update(classId, data);
    revalidateCohort(cohortId, 'sprints');
    
    if (sprintId) revalidatePath(`/sprints/${sprintId}`);
    revalidatePath(`/classes/${classId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to update class:', error);
    return { success: false, error: 'Failed to update class' };
  }
}

export async function deleteClass(classId: string, sprintId?: string) {
  const { pb, cohortId } = await authorizeRecord('classes', classId, 'manage-academics');

  try {
    await pb.collection('classes').delete(classId);
    revalidateCohort(cohortId, 'sprints');
    if (sprintId) revalidatePath(`/sprints/${sprintId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete class:', error);
    return { success: false, error: 'Failed to delete class' };
  }
}

// Assignments

export async function createAssignment(formData: FormData) {
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const sprintId = formData.get('sprintId') as string;

  if (!title || !sprintId) {
     return { success: false, error: 'Title and Sprint ID are required' };
  }

  try {
    const { pb, cohortId } = await authorizeRecord('sprints', sprintId, 'manage-academics');
    const data = {
      title,
      description,
      sprint: sprintId,
    };
    
    await pb.collection('assignments').create(data);
    revalidateCohort(cohortId, 'sprints');
    revalidatePath(`/sprints/${sprintId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to create assignment:', error);
    return { success: false, error: 'Failed to create assignment' };
  }
}

export async function updateAssignment(assignmentId: string, formData: FormData) {
  const { pb, cohortId } = await authorizeRecord('assignments', assignmentId, 'manage-academics');

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const sprintId = formData.get('sprintId') as string;

  try {
    const data = {
      title,
      description,
    };

    await pb.collection('assignments').update(assignmentId, data);
    revalidateCohort(cohortId, 'sprints');
    
    if (sprintId) revalidatePath(`/sprints/${sprintId}`);
    revalidatePath(`/assignments/${assignmentId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to update assignment:', error);
    return { success: false, error: 'Failed to update assignment' };
  }
}

export async function deleteAssignment(assignmentId: string, sprintId?: string) {
  const { pb, cohortId } = await authorizeRecord('assignments', assignmentId, 'manage-academics');

  try {
    await pb.collection('assignments').delete(assignmentId);
    revalidateCohort(cohortId, 'sprints');
    if (sprintId) revalidatePath(`/sprints/${sprintId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete assignment:', error);
    return { success: false, error: 'Failed to delete assignment' };
  }
}

// Links

export async function createLink(formData: FormData) {
  const title = formData.get('title') as string;
  const url = formData.get('url') as string;
  const classId = formData.get('classId') as string;
  const assignmentId = formData.get('assignmentId') as string;

  if (!title || !url || (!classId && !assignmentId)) {
     return { success: false, error: 'Title, URL and Parent ID are required' };
  }

  try {
    const parentCollection = classId ? 'classes' : 'assignments';
    const parentId = classId || assignmentId;
    const { pb, cohortId } = await authorizeRecord(parentCollection, parentId, 'manage-academics');
    const data: Record<string, string> = {
      title,
      url,
    };
    if (classId) data.class = classId;
    if (assignmentId) data.assignment = assignmentId;
    
    await pb.collection('links').create(data);
    revalidateCohort(cohortId, 'sprints');
    
    if (classId) revalidatePath(`/classes/${classId}`);
    if (assignmentId) revalidatePath(`/assignments/${assignmentId}`);
    
    return { success: true };
  } catch (error) {
    console.error('Failed to create link:', error);
    return { success: false, error: 'Failed to create link' };
  }
}

export async function updateLink(linkId: string, formData: FormData) {
  const { pb, cohortId } = await authorizeRecord('links', linkId, 'manage-academics');

  const title = formData.get('title') as string;
  const url = formData.get('url') as string;
  const classId = formData.get('classId') as string;
  const assignmentId = formData.get('assignmentId') as string;

  try {
    const data = {
      title,
      url,
    };

    await pb.collection('links').update(linkId, data);
    revalidateCohort(cohortId, 'sprints');
    
    if (classId) revalidatePath(`/classes/${classId}`);
    if (assignmentId) revalidatePath(`/assignments/${assignmentId}`);
    
    return { success: true };
  } catch (error) {
    console.error('Failed to update link:', error);
    return { success: false, error: 'Failed to update link' };
  }
}

export async function deleteLink(linkId: string, parentId?: string, parentType?: 'class' | 'assignment') {
  const { pb, cohortId } = await authorizeRecord('links', linkId, 'manage-academics');

  try {
    await pb.collection('links').delete(linkId);
    revalidateCohort(cohortId, 'sprints');
    
    if (parentId && parentType) {
        if (parentType === 'class') revalidatePath(`/classes/${parentId}`);
        if (parentType === 'assignment') revalidatePath(`/assignments/${parentId}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Failed to delete link:', error);
    return { success: false, error: 'Failed to delete link' };
  }
}

// Deliveries

export async function createDelivery(formData: FormData) {
  const assignmentId = (formData.get('assignmentId') as string)?.trim();
  const repositoryUrl = (formData.get('repositoryUrl') as string)?.trim();

  if (!assignmentId || !repositoryUrl) {
     return { success: false, error: 'Assignment ID and Repository URL are required' };
  }

  try {
    const { pb, context, cohortId } = await authorizeRecord('assignments', assignmentId);
    requireWritableCohort(context);
    const user = context.user;
    if (user.role !== 'estudiante' || context.cohortRole !== 'student') {
      return { success: false, error: 'Unauthorized: Only active cohort students can submit' };
    }
    const data: Record<string, string> = {
      assignment: assignmentId,
      student: user.id,
      repositoryUrl,
    };
    
    await pb.collection('deliveries').create(data);
    revalidateCohort(cohortId, 'students');
    
    revalidatePath(`/assignments/${assignmentId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to create delivery:', error);
    // Check for unique constraint violation
    if (String(error).includes('unique')) {
        return { success: false, error: 'You have already submitted for this assignment' };
    }
    return { success: false, error: 'Failed to create delivery' };
  }
}

export async function updateDelivery(deliveryId: string, formData: FormData) {
  const { pb, context, cohortId } = await authorizeRecord('deliveries', deliveryId);
  requireWritableCohort(context);
  const delivery = await pb.collection('deliveries').getOne(deliveryId);
  assertOwner(context, String(delivery.student));

  // We need to fetch the delivery to check ownership, 
  // although PocketBase API rules should handle this, it's good to be explicit or just try/catch
  
  const repositoryUrl = (formData.get('repositoryUrl') as string)?.trim();
  const assignmentId = (formData.get('assignmentId') as string)?.trim(); // Needed for revalidation

  if (!repositoryUrl) {
     return { success: false, error: 'Repository URL is required' };
  }

  try {
    const data = {
      repositoryUrl,
    };

    await pb.collection('deliveries').update(deliveryId, data);
    revalidateCohort(cohortId, 'students');
    
    if (assignmentId) revalidatePath(`/assignments/${assignmentId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to update delivery:', error);
    return { success: false, error: 'Failed to update delivery' };
  }
}
