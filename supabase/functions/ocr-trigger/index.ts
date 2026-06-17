import { createClient } from "jsr:@supabase/supabase-js@2";

type StorageWebhookPayload = {
  type: "INSERT";
  table: string;
  record: {
    bucket_id: string;
    name: string; // "{org_id}/{doc_id}"
    id: string;
  };
};

type AzureDiField = {
  content?: string;
  confidence?: number;
};

type AzureDiAnalyzeResult = {
  status: string;
  analyzeResult?: {
    confidence?: number;
    documents?: Array<{
      docType?: string;
      confidence?: number;
      fields?: Record<string, AzureDiField>;
    }>;
    pages?: Array<{ words?: Array<{ confidence?: number }> }>;
  };
};

async function pollForResult(
  endpoint: string,
  operationLocation: string,
  apiKey: string,
): Promise<AzureDiAnalyzeResult> {
  const maxAttempts = 30;
  const delayMs = 2000;

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, delayMs));
    const res = await fetch(operationLocation, {
      headers: { "Ocp-Apim-Subscription-Key": apiKey },
    });
    if (!res.ok) throw new Error(`Poll failed: ${res.status}`);
    const body: AzureDiAnalyzeResult = await res.json();
    if (body.status === "succeeded" || body.status === "failed") {
      return body;
    }
  }
  throw new Error("Azure DI timed out after polling");
}

Deno.serve(async (req) => {
  const payload: StorageWebhookPayload = await req.json();

  if (payload.type !== "INSERT" || payload.table !== "objects") {
    return new Response("ignored", { status: 200 });
  }

  const pathParts = payload.record.name.split("/");
  if (pathParts.length !== 2) {
    return new Response("invalid path format", { status: 200 });
  }
  const documentId = pathParts[1];

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Look up the document record
  const { data: doc, error: docErr } = await supabase
    .from("documents")
    .select("id, file_path, mime_type, ocr_status, org_id")
    .eq("id", documentId)
    .single();

  if (docErr || !doc) {
    console.error("Document not found:", documentId, docErr?.message);
    return new Response("document not found", { status: 200 });
  }

  if (doc.ocr_status !== "pending") {
    return new Response("not pending", { status: 200 });
  }

  // Mark as processing
  await supabase
    .from("documents")
    .update({ ocr_status: "processing" })
    .eq("id", documentId);

  const azureEndpoint = Deno.env.get("AZURE_DI_ENDPOINT");
  const azureKey = Deno.env.get("AZURE_DI_KEY");

  if (!azureEndpoint || !azureKey) {
    await supabase
      .from("documents")
      .update({ ocr_status: "skipped" })
      .eq("id", documentId);
    return new Response("Azure DI not configured — skipped", { status: 200 });
  }

  // Download the file from Supabase Storage
  const { data: fileData, error: storageErr } = await supabase
    .storage
    .from("documents")
    .download(doc.file_path);

  if (storageErr || !fileData) {
    await supabase
      .from("documents")
      .update({ ocr_status: "failed" })
      .eq("id", documentId);
    return new Response("storage download failed", { status: 200 });
  }

  try {
    // Submit to Azure Document Intelligence (prebuilt-invoice model)
    const model = "prebuilt-invoice";
    const analyzeUrl =
      `${azureEndpoint}/documentintelligence/documentModels/${model}:analyze?api-version=2024-07-31-preview`;

    const submitRes = await fetch(analyzeUrl, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": azureKey,
        "Content-Type": doc.mime_type ?? "application/pdf",
      },
      body: await fileData.arrayBuffer(),
    });

    if (!submitRes.ok) {
      throw new Error(`Azure submit failed: ${submitRes.status} ${await submitRes.text()}`);
    }

    const operationLocation = submitRes.headers.get("Operation-Location");
    if (!operationLocation) throw new Error("No Operation-Location header");

    const result = await pollForResult(azureEndpoint, operationLocation, azureKey);

    if (result.status !== "succeeded" || !result.analyzeResult) {
      throw new Error(`Azure DI status: ${result.status}`);
    }

    // Compute average confidence from page words
    const words = result.analyzeResult.pages?.flatMap((p) => p.words ?? []) ?? [];
    const avgConfidence = words.length > 0
      ? words.reduce((s, w) => s + (w.confidence ?? 0), 0) / words.length
      : null;

    // Insert extraction record
    const { data: extraction, error: extErr } = await supabase
      .from("document_extractions")
      .insert({
        document_id: documentId,
        engine: "azure-di",
        status: "done",
        confidence: avgConfidence,
        raw_json: result.analyzeResult,
      })
      .select("id")
      .single();

    if (extErr || !extraction) throw new Error(extErr?.message ?? "extraction insert failed");

    // Insert document fields from the first detected document
    const docFields = result.analyzeResult.documents?.[0]?.fields ?? {};
    const fieldRows = Object.entries(docFields)
      .filter(([, v]) => v.content != null)
      .map(([name, v]) => ({
        extraction_id: extraction.id,
        field_name: name,
        field_value: v.content ?? "",
        confidence: v.confidence ?? null,
        reviewed: false,
      }));

    if (fieldRows.length > 0) {
      await supabase.from("document_fields").insert(fieldRows);
    }

    await supabase
      .from("documents")
      .update({ ocr_status: "done" })
      .eq("id", documentId);

    return new Response(
      JSON.stringify({ ok: true, fields: fieldRows.length, confidence: avgConfidence }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("OCR failed for", documentId, err);
    await supabase
      .from("documents")
      .update({ ocr_status: "failed" })
      .eq("id", documentId);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }
});
