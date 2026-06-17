"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveCurrentOrg } from "@/lib/org/membership";
import { getCurrentUser } from "@/lib/auth/session";

export type DocumentFormState =
  | { status: "idle" }
  | { status: "error"; message: string };

const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const UploadSchema = z.object({
  doc_type: z.enum(["invoice", "receipt", "contract", "other"]),
  event_id: z.string().uuid().optional(),
});

export async function uploadDocument(
  _prevState: DocumentFormState,
  formData: FormData,
): Promise<DocumentFormState> {
  const file = formData.get("file");

  if (!file || !(file instanceof File) || file.size === 0) {
    return { status: "error", message: "A file is required" };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { status: "error", message: "File must be 10 MB or smaller" };
  }

  const mimeType = file.type as string;
  if (!(ACCEPTED_MIME_TYPES as readonly string[]).includes(mimeType)) {
    return {
      status: "error",
      message: "Only PDF, JPEG, PNG, and WebP files are accepted",
    };
  }

  const parsed = UploadSchema.safeParse({
    doc_type: formData.get("doc_type") ?? "other",
    event_id: (formData.get("event_id") as string) || undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const [currentOrg, user] = await Promise.all([
    resolveCurrentOrg(),
    getCurrentUser(),
  ]);

  if (!currentOrg || !user) {
    return { status: "error", message: "Authentication required" };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { status: "error", message: "Database unavailable" };
  }

  const docId = crypto.randomUUID();
  const storagePath = `${currentOrg.organizationId}/${docId}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: storageError } = await supabase.storage
    .from("documents")
    .upload(storagePath, arrayBuffer, { contentType: mimeType });

  if (storageError) {
    return { status: "error", message: "Failed to upload file" };
  }

  const { error: dbError } = await supabase.from("documents").insert({
    id: docId,
    organization_id: currentOrg.organizationId,
    event_id: parsed.data.event_id ?? null,
    file_path: storagePath,
    file_name: file.name,
    mime_type: mimeType,
    file_size_bytes: file.size,
    doc_type: parsed.data.doc_type,
    ocr_status: "pending",
    uploaded_by: user.id,
  });

  if (dbError) {
    await supabase.storage.from("documents").remove([storagePath]);
    return { status: "error", message: "Failed to save document record" };
  }

  redirect(`/documents/${docId}`);
}

export async function deleteDocument(documentId: string): Promise<void> {
  const currentOrg = await resolveCurrentOrg();
  if (!currentOrg) return;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return;

  const { data } = await supabase
    .from("documents")
    .select("file_path")
    .eq("id", documentId)
    .eq("organization_id", currentOrg.organizationId)
    .single();

  if (data?.file_path) {
    await supabase.storage.from("documents").remove([data.file_path]);
  }

  await supabase
    .from("documents")
    .delete()
    .eq("id", documentId)
    .eq("organization_id", currentOrg.organizationId);

  redirect("/documents");
}

export async function updateDocumentType(
  documentId: string,
  docType: "invoice" | "receipt" | "contract" | "other",
): Promise<void> {
  const currentOrg = await resolveCurrentOrg();
  if (!currentOrg) return;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return;

  await supabase
    .from("documents")
    .update({ doc_type: docType })
    .eq("id", documentId)
    .eq("organization_id", currentOrg.organizationId);

  redirect(`/documents/${documentId}`);
}
