"use server";

import { createServerClient } from "./pocketbase-server";
import { revalidatePath } from "next/cache";
import { Inquiry, InquiryResponse } from "@/types";
import { assertOwner, authorizeRecord, requireWritableCohort, resolveCohortContext, resolveRecordCohortId } from "./cohort-context";
import { revalidateCohort } from "./cohort-cache";
import { errorMessage, errorResponse, errorStatus } from "./errors";

// --- Inquiries ---

export async function getInquiries(cohortId: string, filter?: { classId?: string; assignmentId?: string; status?: string; authorId?: string; search?: string }) {
  const pb = await createServerClient();
  const user = pb.authStore.model;

  if (!user) return [];
  await resolveCohortContext(cohortId, pb);

  try {
    const filters = [pb.filter('cohort = {:cohort}', { cohort: cohortId })];
    let inquiryIdsFromResponses: string[] = [];

    if (filter?.classId) filters.push(`class = "${filter.classId}"`);
    if (filter?.assignmentId) filters.push(`assignment = "${filter.assignmentId}"`);
    if (filter?.status) filters.push(`status = "${filter.status}"`);
    if (filter?.authorId) filters.push(`author = "${filter.authorId}"`);

    if (filter?.search) {
      const searchTerm = filter.search.replace(/"/g, '\\"');
      
      // Buscar en respuestas (limitado a 50 resultados para no sobrecargar)
      const matchingResponseRecords = await pb.collection("inquiry_responses").getList(1, 50, {
        // PocketBase already scopes this list through the inquiry_responses rule.
        // The final inquiries query below applies the active cohort again.
        filter: `content ~ "${searchTerm}"`,
      });
      inquiryIdsFromResponses = matchingResponseRecords.items.map(r => r.inquiry as string).filter(Boolean);
      
      const orConditions = [
        `title ~ "${searchTerm}"`,
        `description ~ "${searchTerm}"`,
        `author.name ~ "${searchTerm}"`,
        `author.email ~ "${searchTerm}"`,
        `class.title ~ "${searchTerm}"`,
        `assignment.title ~ "${searchTerm}"`,
        // Intentamos buscar en sprint a través de class/assignment si es posible (depende de configuración de PB y profundidad de expand)
        // Nota: PB no siempre permite filtrar relaciones anidadas profundas sin expand explícito o configuración.
        // Pero 'class.sprint' es solo un nivel de relación desde class.
        // Sin embargo, desde inquiry es 'class.sprint.title' (2 niveles).
        // PocketBase permite filtrar relaciones de N niveles.
        `class.sprint.title ~ "${searchTerm}"`,
        `assignment.sprint.title ~ "${searchTerm}"`,
      ];

      filters.push(`(${orConditions.join(" || ")})`);
    }

    const filterString = filters.join(" && ");

    const inquiries = await pb.collection("inquiries").getFullList<Inquiry>({
      filter: filterString,
      sort: "-created",
      expand: "author,class,assignment",
    });

    if (inquiryIdsFromResponses.length === 0) return inquiries;

    const responseIdFilter = inquiryIdsFromResponses
      .slice(0, 20)
      .map((id) => `id = "${id}"`)
      .join(' || ');
    const responseFilters = filter?.search ? filters.slice(0, -1) : filters;
    const responseMatches = await pb.collection('inquiries').getFullList<Inquiry>({
      filter: [...responseFilters, `(${responseIdFilter})`].join(' && '),
      sort: '-created',
      expand: 'author,class,assignment',
    });
    return [...new Map([...inquiries, ...responseMatches].map((inquiry) => [inquiry.id, inquiry])).values()];
  } catch (error) {
    console.error("Error fetching inquiries:", error);
    return [];
  }
}

export async function getInquiry(id: string) {
  try {
    const { pb, context, cohortId } = await authorizeRecord('inquiries', id);
    const inquiry = await pb.collection("inquiries").getOne<Inquiry>(id, {
      expand: "author,class,assignment",
    });
    return {
      success: true,
      data: inquiry,
      cohortId,
      canManage: context.permissions.has('manage-academics'),
      readOnly: context.cohort.status === 'archived',
    };
  } catch (error: unknown) {
    // Suppress 404 errors as they are expected when resource is not found
    if (errorStatus(error) !== 404) {
      console.error("Error fetching inquiry:", error);
    }
    return { success: false, error: "Consulta no encontrada" };
  }
}

export async function createInquiry(data: { cohortId: string; title: string; description: string; classId?: string; assignmentId?: string }) {
  const pb = await createServerClient();

  try {
    const context = await resolveCohortContext(data.cohortId, pb);
    requireWritableCohort(context);
    const user = context.user;
    if (!data.title.trim() || !data.description.trim()) throw new Error('INQUIRY_CONTENT_REQUIRED');
    if (data.classId && data.assignmentId) throw new Error('INQUIRY_CONTEXT_AMBIGUOUS');
    for (const [collection, id] of [["classes", data.classId], ["assignments", data.assignmentId]] as const) {
      if (id && await resolveRecordCohortId(pb, collection, id) !== data.cohortId) throw new Error("CROSS_COHORT_CONTEXT");
    }
    const newInquiry: Record<string, string> = {
      title: data.title.trim(),
      description: data.description.trim(),
      status: "Pendiente",
      author: user.id,
      cohort: data.cohortId,
    };

    if (data.classId) newInquiry.class = data.classId;
    if (data.assignmentId) newInquiry.assignment = data.assignmentId;

    const record = await pb.collection("inquiries").create(newInquiry);
    revalidateCohort(data.cohortId, 'inquiries');
    
    revalidatePath("/inquiries");
    if (data.classId) revalidatePath(`/classes/${data.classId}`);
    if (data.assignmentId) revalidatePath(`/assignments/${data.assignmentId}`);
    
    return { success: true, data: record };
  } catch (error: unknown) {
    console.error("Error creating inquiry:", error);
    if (errorResponse(error)) {
      console.error("PB Validation Errors:", JSON.stringify(errorResponse(error), null, 2));
    }
    return { success: false, error: errorMessage(error, "Error al crear la consulta") };
  }
}

export async function updateInquiryStatus(id: string, status: "Pendiente" | "Resuelta") {
  try {
    const { pb, context, cohortId } = await authorizeRecord('inquiries', id);
    requireWritableCohort(context);
    const inquiry = await pb.collection('inquiries').getOne<Inquiry>(id);
    if (!context.permissions.has('manage-academics')) assertOwner(context, inquiry.author);
    await pb.collection("inquiries").update(id, { status });
    revalidateCohort(cohortId, 'inquiries');
    revalidatePath(`/inquiries/${id}`);
    revalidatePath("/inquiries");
    return { success: true };
  } catch (error: unknown) {
    console.error("Error updating inquiry status:", error);
    return { success: false, error: errorMessage(error, "Error al actualizar estado") };
  }
}

export async function deleteInquiry(id: string) {
  try {
    const { pb, context, cohortId } = await authorizeRecord('inquiries', id);
    requireWritableCohort(context);
    const inquiry = await pb.collection('inquiries').getOne<Inquiry>(id);
    if (!context.permissions.has('manage-academics')) assertOwner(context, inquiry.author);
    await pb.collection("inquiries").delete(id);
    revalidateCohort(cohortId, 'inquiries');
    revalidatePath("/inquiries");
    return { success: true };
  } catch (error: unknown) {
    console.error("Error deleting inquiry:", error);
    return { success: false, error: errorMessage(error, "Error al eliminar la consulta") };
  }
}

// --- Responses ---

export async function getInquiryResponses(inquiryId: string) {
  try {
    const { pb } = await authorizeRecord('inquiries', inquiryId);
    const responses = await pb.collection("inquiry_responses").getFullList<InquiryResponse>({
      filter: `inquiry = "${inquiryId}"`,
      sort: "created",
      expand: "author",
    });
    return responses;
  } catch (error) {
    console.error("Error fetching responses:", error);
    return [];
  }
}

export async function createInquiryResponse(inquiryId: string, content: string) {
  try {
    const { pb, context, cohortId } = await authorizeRecord('inquiries', inquiryId);
    requireWritableCohort(context);
    const user = context.user;
    const normalizedContent = content.trim();
    if (!normalizedContent) throw new Error('INQUIRY_RESPONSE_REQUIRED');
    const newResponse = {
      inquiry: inquiryId,
      author: user.id,
      content: normalizedContent,
    };

    await pb.collection("inquiry_responses").create(newResponse);
    revalidateCohort(cohortId, 'inquiries');
    revalidatePath(`/inquiries/${inquiryId}`);
    return { success: true };
  } catch (error: unknown) {
    console.error("Error creating response:", error);
    return { success: false, error: errorMessage(error, "Error al enviar respuesta") };
  }
}

export async function deleteInquiryResponse(responseId: string, inquiryId: string) {
  try {
    const { pb, context, cohortId } = await authorizeRecord('inquiry_responses', responseId);
    requireWritableCohort(context);
    const response = await pb.collection('inquiry_responses').getOne<InquiryResponse>(responseId);
    if (response.inquiry !== inquiryId) throw new Error('INQUIRY_RELATION_MISMATCH');
    if (!context.permissions.has('manage-academics')) assertOwner(context, response.author);
    await pb.collection("inquiry_responses").delete(responseId);
    revalidateCohort(cohortId, 'inquiries');
    revalidatePath(`/inquiries/${inquiryId}`);
    return { success: true };
  } catch (error: unknown) {
    console.error("Error deleting response:", error);
    return { success: false, error: errorMessage(error, "Error al eliminar respuesta") };
  }
}
