"use server";

import { createServerClient } from "@/lib/pocketbase-server";
import { revalidatePath } from "next/cache";
import { Review } from "@/types";

export async function createReviewSlot(sprintId: string, startTime: string, endTime: string) {
  const pb = await createServerClient();
  const user = pb.authStore.model;

  if (!user || (user.role !== 'docente' && user.role !== 'admin')) {
    return { success: false, error: 'No autorizado' };
  }

  try {
    await pb.collection('reviews').create({
      sprint: sprintId,
      teacher: user.id,
      startTime,
      endTime,
    });
    revalidatePath(`/reviews/${sprintId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error creating review:', error);
    return { success: false, error: error?.message || 'Error al crear el turno' };
  }
}

export async function createReviewSlotsBatch(
    sprintId: string,
    startDateTime: string,
    slotDuration: number, // in minutes
    quantity: number,
    breakDuration: number = 0, // in minutes
    breakFrequency: number = 0 // every N slots
) {
    const pb = await createServerClient();
    const user = pb.authStore.model;

    if (!user || (user.role !== 'docente' && user.role !== 'admin')) {
        return { success: false, error: 'No autorizado' };
    }

    try {
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

        revalidatePath(`/reviews/${sprintId}`);
        return { success: true };
    } catch (error: any) {
        console.error('Error creating review batch:', error);
        return { success: false, error: error?.message || 'Error al crear los turnos' };
    }
}

export async function bookReviewSlot(reviewId: string) {
  const pb = await createServerClient();
  const user = pb.authStore.model;

  if (!user || user.role !== 'estudiante') {
    return { success: false, error: 'Solo estudiantes pueden reservar turnos' };
  }

  try {
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
    revalidatePath(`/reviews/${review.sprint}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error booking review:', error);
    return { success: false, error: error?.message || 'Error al reservar el turno' };
  }
}

export async function cancelReviewBooking(reviewId: string) {
    const pb = await createServerClient();
    const user = pb.authStore.model;

    if (!user) {
        return { success: false, error: 'No autorizado' };
    }

    try {
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

        await pb.collection('reviews').update(reviewId, {
            student: null,
        });
        revalidatePath(`/reviews/${review.sprint}`);
        return { success: true };
    } catch (error: any) {
        console.error('Error canceling review:', error);
        return { success: false, error: error?.message || 'Error al cancelar la reserva' };
    }
}

export async function deleteReviewSlot(reviewId: string) {
    const pb = await createServerClient();
    const user = pb.authStore.model;

    if (!user || (user.role !== 'docente' && user.role !== 'admin')) {
        return { success: false, error: 'No autorizado' };
    }

    try {
        const review = await pb.collection('reviews').getOne<Review>(reviewId);
        await pb.collection('reviews').delete(reviewId);
        revalidatePath(`/reviews/${review.sprint}`);
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting review:', error);
        return { success: false, error: error?.message || 'Error al eliminar el turno' };
    }
}

export async function getReview(reviewId: string) {
    const pb = await createServerClient();
    try {
        const review = await pb.collection('reviews').getOne<Review>(reviewId, {
            expand: 'sprint,teacher,student'
        });
        return { success: true, data: review };
    } catch (error: any) {
        console.error('Error fetching review:', error);
        return { success: false, error: error?.message || 'Error al obtener el turno' };
    }
}

export async function updateReviewNotes(reviewId: string, privateNote: string, publicNote: string) {
    const pb = await createServerClient();
    const user = pb.authStore.model;

    if (!user || (user.role !== 'docente' && user.role !== 'admin')) {
        return { success: false, error: 'No autorizado' };
    }

    try {
        // We need to fetch the review to get the sprint ID for revalidation
        const review = await pb.collection('reviews').getOne<Review>(reviewId);
        
        await pb.collection('reviews').update(reviewId, {
            private_note: privateNote,
            public_note: publicNote
        });
        
        revalidatePath(`/reviews/${review.sprint}`);
        // Also revalidate the specific detail page if we were using it, but here we just need to update data
        return { success: true };
    } catch (error: any) {
        console.error('Error updating review notes:', error);
        return { success: false, error: error?.message || 'Error al actualizar las notas' };
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
    const pb = await createServerClient();
    const user = pb.authStore.model;

    if (!user || (user.role !== 'docente' && user.role !== 'admin')) {
        return { success: false, error: 'No autorizado' };
    }

    try {
        if (reviewId) {
            // Update existing review
            await pb.collection('reviews').update(reviewId, {
                private_note: privateNote,
                public_note: publicNote,
                status: status
            });
        } else {
            // Create new review
            // We set start/end time to now as placeholders since they are likely required
            const now = new Date().toISOString();
            await pb.collection('reviews').create({
                sprint: sprintId,
                teacher: user.id,
                student: studentId,
                startTime: now,
                endTime: now,
                private_note: privateNote,
                public_note: publicNote,
                status: status
            });
        }
        
        revalidatePath(`/students`);
        revalidatePath(`/reviews/${sprintId}`);
        return { success: true };
    } catch (error: any) {
        console.error('Error upserting review notes:', error);
        return { success: false, error: error?.message || 'Error al guardar las notas' };
    }
}
