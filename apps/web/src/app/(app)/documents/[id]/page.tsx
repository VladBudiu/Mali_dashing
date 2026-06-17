import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { resolveCurrentOrg } from "@/lib/org/membership";
import {
  getDocument,
  getDocumentExtractions,
  getDocumentFields,
} from "@/lib/documents/queries";
import { deleteDocument } from "@/lib/documents/actions";
import { NavLink } from "@/components/ui/NavLink";
import { OcrStatusPoller } from "@/components/documents/OcrStatusPoller";

export const metadata: Metadata = { title: "Document" };

const OCR_STATUS_COLOR: Record<
  string,
  "default" | "warning" | "success" | "error" | "info"
> = {
  pending: "warning",
  processing: "info",
  done: "success",
  failed: "error",
  skipped: "default",
};

const DOC_TYPE_LABEL: Record<string, string> = {
  invoice: "Invoice",
  receipt: "Receipt",
  contract: "Contract",
  other: "Other",
};

type PageProps = { params: Promise<{ id: string }> };

export default async function DocumentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const currentOrg = await resolveCurrentOrg();
  if (!currentOrg) return null;

  const doc = await getDocument(currentOrg.organizationId, id);
  if (!doc) notFound();

  const extractions = await getDocumentExtractions(id);
  const firstExtraction = extractions[0] ?? null;
  const fields = firstExtraction
    ? await getDocumentFields(firstExtraction.id)
    : [];

  const isOwner = currentOrg.role === "owner";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Breadcrumbs>
        <NavLink href="/documents" underline="hover" color="inherit">
          Documents
        </NavLink>
        <Typography color="text.primary">{doc.file_name}</Typography>
      </Breadcrumbs>

      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
        <Typography variant="h5" sx={{ flex: 1, fontWeight: 700 }}>
          {doc.file_name}
        </Typography>
        {isOwner && (
          <form action={deleteDocument.bind(null, doc.id)}>
            <Button type="submit" color="error" variant="outlined" size="small">
              Delete
            </Button>
          </form>
        )}
      </Box>

      {/* Metadata grid */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "160px 1fr",
            rowGap: 1.5,
            columnGap: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Type
          </Typography>
          <Typography variant="body2">
            {DOC_TYPE_LABEL[doc.doc_type] ?? doc.doc_type}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            OCR status
          </Typography>
          <Chip
            label={doc.ocr_status}
            size="small"
            color={OCR_STATUS_COLOR[doc.ocr_status] ?? "default"}
            variant="outlined"
            sx={{ width: "fit-content" }}
          />

          <Typography variant="body2" color="text.secondary">
            Uploaded
          </Typography>
          <Typography variant="body2">
            {new Date(doc.created_at).toLocaleString("ro-RO")}
          </Typography>

          {doc.events?.title && (
            <>
              <Typography variant="body2" color="text.secondary">
                Event
              </Typography>
              <NavLink href={`/events/${doc.event_id}`} underline="hover">
                {doc.events.title}
              </NavLink>
            </>
          )}

          {doc.file_size_bytes && (
            <>
              <Typography variant="body2" color="text.secondary">
                Size
              </Typography>
              <Typography variant="body2">
                {(doc.file_size_bytes / 1024).toFixed(0)} KB
              </Typography>
            </>
          )}

          <Typography variant="body2" color="text.secondary">
            MIME type
          </Typography>
          <Typography variant="body2">{doc.mime_type}</Typography>
        </Box>
      </Paper>

      {/* OCR fields */}
      {firstExtraction && fields.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Extracted fields
            {firstExtraction.confidence != null && (
              <Typography
                component="span"
                variant="body2"
                color="text.secondary"
                sx={{ ml: 1 }}
              >
                confidence: {(firstExtraction.confidence * 100).toFixed(0)}%
              </Typography>
            )}
          </Typography>
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Field</TableCell>
                  <TableCell>Value</TableCell>
                  <TableCell>Confidence</TableCell>
                  <TableCell>Validated</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fields.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>{f.field_name}</TableCell>
                    <TableCell>{f.field_value ?? "—"}</TableCell>
                    <TableCell>
                      {f.confidence != null
                        ? `${(f.confidence * 100).toFixed(0)}%`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={f.is_validated ? "Yes" : "No"}
                        size="small"
                        color={f.is_validated ? "success" : "default"}
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Box>
      )}

      {doc.ocr_status === "processing" && (
        <>
          <Typography color="text.secondary" variant="body2">
            OCR in progress — this page refreshes automatically every 5 seconds.
          </Typography>
          <OcrStatusPoller />
        </>
      )}

      {doc.ocr_status === "pending" && (
        <Typography color="text.secondary" variant="body2">
          This document is queued for OCR processing. Extracted fields will
          appear here once processing is complete.
        </Typography>
      )}
    </Box>
  );
}
