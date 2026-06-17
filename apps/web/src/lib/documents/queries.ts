import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type DocumentRow = {
  id: string;
  organization_id: string;
  event_id: string | null;
  expense_claim_id: string | null;
  file_path: string;
  file_name: string;
  mime_type: string;
  file_size_bytes: number | null;
  doc_type: "invoice" | "receipt" | "contract" | "other";
  ocr_status: "pending" | "processing" | "done" | "failed" | "skipped";
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
};

export type DocumentWithEvent = DocumentRow & {
  events: { title: string } | null;
};

export type DocumentExtractionRow = {
  id: string;
  document_id: string;
  engine: string;
  status: "pending" | "processing" | "done" | "failed";
  confidence: number | null;
  raw_json: unknown | null;
  created_at: string;
  updated_at: string;
};

export type DocumentFieldRow = {
  id: string;
  extraction_id: string;
  field_name: string;
  field_value: string | null;
  confidence: number | null;
  is_validated: boolean;
  created_at: string;
};

export async function listDocuments(
  organizationId: string,
): Promise<DocumentWithEvent[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("documents")
    .select("*, events(title)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(200)
    .returns<DocumentWithEvent[]>();

  return data ?? [];
}

export async function getDocument(
  organizationId: string,
  documentId: string,
): Promise<DocumentWithEvent | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("documents")
    .select("*, events(title)")
    .eq("organization_id", organizationId)
    .eq("id", documentId)
    .single()
    .returns<DocumentWithEvent>();

  return data ?? null;
}

export async function getDocumentExtractions(
  documentId: string,
): Promise<DocumentExtractionRow[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("document_extractions")
    .select("*")
    .eq("document_id", documentId)
    .order("created_at", { ascending: false })
    .returns<DocumentExtractionRow[]>();

  return data ?? [];
}

export async function getDocumentFields(
  extractionId: string,
): Promise<DocumentFieldRow[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("document_fields")
    .select("*")
    .eq("extraction_id", extractionId)
    .order("field_name", { ascending: true })
    .returns<DocumentFieldRow[]>();

  return data ?? [];
}
