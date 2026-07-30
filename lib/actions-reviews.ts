"use server";

import { revalidatePath } from "next/cache";
import { Enrollment, Review, ReviewPrivateNote, User } from "@/types";
import { authorizeRecord, requireCohortPermission, requireWritableCohort } from "./cohort-context";
import { revalidateCohort } from "./cohort-cache";
import { errorMessage } from "./errors";
import { attachPrivateReviewNote, withoutPrivateReviewFields } from "./review-privacy";

async function requireActiveStudentInCohort(
    pb: Awaited<ReturnType<typeof authorizeRecord>>['pb'],
    cohortId: string,
    studentId: string,
) {
    const [student, enrollment] = await Promise.all([
        pb.collection('users').getOne<User>(studentId),
        pb.collection('enrollments').getFirstListItem<Enrollment>(
            pb.filter('cohort = {:cohort} && user = {:user} && role = "student" && status = "active"', {
                cohort: cohortId,
                user: studentId,
            }),
        ),
    ]);
    if (student.role !== 'estudiante' || enrollment.user !== studentId) throw new Error('STUDENT_NOT_ACTIVE_IN_COHORT');
}

export async function createReviewSlot(sprintId: string, startTime: string, endTime: string) {
  try {
    const { pb, context, cohortId } = await authorizeRecord('sprints', sprintId, 'manage-academics');
    const user = context.user;
    await pb.collection('reviews').create({
      sprint: sprintId,
      teacher: user.id,
      startTime,
      endTime,
    });
    revalidateCohort(cohortId, 'reviews');
    revalidatePath(`/reviews/${sprintId}`);
    return { success: true };
  } catch (error: unknown) {
    console.error('Error creating review:', error);
    return { success: false, error: errorMessage(error, 'Error al crear el turno') };
  }
}

export async function createReviewSlotsBatch(
    sprintId: string,
    startDateTime: string,
    slotDuration: number, // in minutes
    quantity: number,
    breakDuration: number = 0, // in minutes
    breakFrequency: number = 0, // every N slots
    meetingLink: string = "",
    roomNumber: string = ""
) {
    try {
        const { pb, context, cohortId } = await authorizeRecord('sprints', sprintId, 'manage-academics');
        const user = context.user;
        let currentStartTime = new Date(startDateTime);
        const slotsToCreate = [];

        for (let i = 0; i < quantity; i++) {
            const startTime = new Date(currentStartTime);
            const endTime = new Date(currentStartTime.getTime() + slotDuration * 60000);

            slotsToCreate.push({
                sprint: sprintId,
                teacher: user.id,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                meetingLink,
                roomNumber
            });

            // Update currentStartTime for the next slot
            currentStartTime = new Date(endTime.getTime());

            // Add break if applicable
            if (breakDuration > 0 && breakFrequency > 0 && (i + 1) % breakFrequency === 0 && (i + 1) < quantity) {
                currentStartTime = new Date(currentStartTime.getTime() + breakDuration * 60000);
            }
        }

        // Execute creations in parallel
        await Promise.all(slotsToCreate.map(data => 
            pb.collection('reviews').create(data, { requestKey: null })
        ));
        revalidateCohort(cohortId, 'reviews');

        revalidatePath(`/reviews/${sprintId}`);
        return { success: true };
    } catch (error: unknown) {
        console.error('Error creating review batch:', error);
        return { success: false, error: errorMessage(error, 'Error al crear los turnos') };
    }
}

export async function bookReviewSlot(reviewId: string) {
  try {
    const { pb, context, cohortId } = await authorizeRecord('reviews', reviewId);
    requireWritableCohort(context);
    const user = context.user;
    if (user.role !== 'estudiante' || context.cohortRole !== 'student') {
      return { success: false, error: 'Solo estudiantes activos de la cohorte pueden reservar turnos' };
    }
    // Check if slot is already booked
    const review = await pb.collection('reviews').getOne<Review>(reviewId);
    if (review.student) {
      return { success: false, error: 'Este turno ya está reservado' };
    }
    
    // Check if student already has a booking in this sprint
    const existingReview = await pb.collection('reviews').getFirstListItem(
      `sprint = "${review.sprint}" && student = "${user.id}"`
    ).catch(() => null);

    if (existingReview) {
       return { success: false, error: 'Ya tienes un turno reservado en este sprint' };
    }

    await pb.collection('reviews').update(reviewId, {
      student: user.id,
    });
    revalidateCohort(cohortId, 'reviews');
    revalidatePath(`/reviews/${review.sprint}`);
    return { success: true };
  } catch (error: unknown) {
    console.error('Error booking review:', error);
    if (String(error).includes('unique') || String(error).includes('409')) {
      return { success: false, error: 'Ya tienes un turno reservado en este sprint' };
    }
    return { success: false, error: errorMessage(error, 'Error al reservar el turno') };
  }
}

export async function cancelReviewBooking(reviewId: string) {
    try {
        const { pb, context, cohortId } = await authorizeRecord('reviews', reviewId);
        requireWritableCohort(context);
        const user = context.user;
        const review = await pb.collection('reviews').getOne<Review>(reviewId);
        
        // Allow student to cancel their own booking
        if (user.role === 'estudiante') {
            if (review.student !== user.id) {
                return { success: false, error: 'No puedes cancelar una reserva que no es tuya' };
            }
        } else if (user.role !== 'docente' && user.role !== 'admin') {
             // Teachers can cancel any booking (remove student from slot)
             return { success: false, error: 'No autorizado' };
        }
        if (user.role === 'docente') requireCohortPermission(context, 'manage-academics');

        await pb.collection('reviews').update(reviewId, {
            student: null,
        });
        revalidateCohort(cohortId, 'reviews');
        revalidatePath(`/reviews/${review.sprint}`);
        return { success: true };
    } catch (error: unknown) {
        console.error('Error canceling review:', error);
        return { success: false, error: errorMessage(error, 'Error al cancelar la reserva') };
    }
}

export async function deleteReviewSlot(reviewId: string) {
    try {
        const { pb, cohortId } = await authorizeRecord('reviews', reviewId, 'manage-academics');
        const review = await pb.collection('reviews').getOne<Review>(reviewId);
        await pb.collection('reviews').delete(reviewId);
        revalidateCohort(cohortId, 'reviews');
        revalidatePath(`/reviews/${review.sprint}`);
        return { success: true };
    } catch (error: unknown) {
        console.error('Error deleting review:', error);
        return { success: false, error: errorMessage(error, 'Error al eliminar el turno') };
    }
}

export async function getReview(reviewId: string) {
    try {
        const { pb, context, cohortId } = await authorizeRecord('reviews', reviewId);
        const review = await pb.collection('reviews').getOne<Review>(reviewId, {
            expand: 'sprint,teacher,student'
        });
        if (!context.permissions.has('manage-academics')) {
            if (review.student !== context.user.id) throw new Error('REVIEW_OWNERSHIP_DENIED');
            return { success: true, data: withoutPrivateReviewFields(review), cohortId, canManage: false };
        }
        const privateNote = await pb.collection('review_private_notes')
            .getFirstListItem<ReviewPrivateNote>(pb.filter('review = {:review}', { review: reviewId }))
            .catch(() => undefined);
        return { success: true, data: attachPrivateReviewNote(review, privateNote), cohortId, canManage: true };
    } catch (error: unknown) {
        console.error('Error fetching review:', error);
        return { success: false, error: errorMessage(error, 'Error al obtener el turno') };
    }
}

export async function updateReviewNotes(
    reviewId: string, 
    privateNote: string, 
    publicNote: string,
    meetingLink: string = "",
    roomNumber: string = ""
) {
    try {
        const { pb, cohortId } = await authorizeRecord('reviews', reviewId, 'manage-academics');
        // We need to fetch the review to get the sprint ID for revalidation
        const review = await pb.collection('reviews').getOne<Review>(reviewId);
        
        await pb.collection('reviews').update(reviewId, {
            public_note: publicNote,
            meetingLink,
            roomNumber
        });
        const privateNotes = await pb.collection('review_private_notes').getFullList({
            filter: pb.filter('review = {:review}', { review: reviewId }),
        });
        if (privateNotes[0]) await pb.collection('review_private_notes').update(privateNotes[0].id, { content: privateNote });
        else await pb.collection('review_private_notes').create({ review: reviewId, content: privateNote });
        revalidateCohort(cohortId, 'reviews');
        
        revalidatePath(`/reviews/${review.sprint}`);
        // Also revalidate the specific detail page if we were using it, but here we just need to update data
        return { success: true };
    } catch (error: unknown) {
        console.error('Error updating review notes:', error);
        return { success: false, error: errorMessage(error, 'Error al actualizar las notas') };
    }
}

export async function upsertReviewNotes(
    sprintId: string, 
    studentId: string, 
    privateNote: string, 
    publicNote: string,
    status: 'Aprobado' | 'Pendiente' | 'No presentó' | 'Desaprobado',
    reviewId?: string
) {
    try {
        const authorization = reviewId
            ? await authorizeRecord('reviews', reviewId, 'manage-academics')
            : await authorizeRecord('sprints', sprintId, 'manage-academics');
        const { pb, cohortId, context } = authorization;
        const user = context.user;
        await requireActiveStudentInCohort(pb, cohortId, studentId);
        let targetReviewId = reviewId;
        if (reviewId) {
            const existingReview = await pb.collection('reviews').getOne<Review>(reviewId);
            if (existingReview.sprint !== sprintId || (existingReview.student && existingReview.student !== studentId)) {
                throw new Error('REVIEW_RELATION_MISMATCH');
            }
            // Update existing review
            await pb.collection('reviews').update(reviewId, {
                public_note: publicNote,
                status: status
            });
        } else {
            // Create new review
            // We set start/end time to now as placeholders since they are likely required
            const now = new Date().toISOString();
            const created = await pb.collection('reviews').create({
                sprint: sprintId,
                teacher: user.id,
                student: studentId,
                startTime: now,
                endTime: now,
                public_note: publicNote,
                status: status
            });
            targetReviewId = created.id;
        }
        if (!targetReviewId) throw new Error('No se pudo resolver la revisión');
        const notes = await pb.collection('review_private_notes').getFullList({ filter: pb.filter('review = {:review}', { review: targetReviewId }) });
        if (notes[0]) await pb.collection('review_private_notes').update(notes[0].id, { content: privateNote });
        else await pb.collection('review_private_notes').create({ review: targetReviewId, content: privateNote });
        revalidateCohort(cohortId, 'reviews', 'students');
        
        revalidatePath(`/students`);
        revalidatePath(`/reviews/${sprintId}`);
        return { success: true };
    } catch (error: unknown) {
        console.error('Error upserting review notes:', error);
        return { success: false, error: errorMessage(error, 'Error al guardar las notas') };
    }
}
