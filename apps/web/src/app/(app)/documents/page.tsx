import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { resolveCurrentOrg } from "@/lib/org/membership";
import { listDocuments } from "@/lib/documents/queries";
import { LinkButton } from "@/components/ui/LinkButton";
import { NavLink } from "@/components/ui/NavLink";
import { LinkRow } from "@/components/ui/LinkRow";

export const metadata: Metadata = { title: "Documents" };

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

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function DocumentsPage() {
  const currentOrg = await resolveCurrentOrg();
  if (!currentOrg) return null;

  const documents = await listDocuments(currentOrg.organizationId);

  const pendingCount = documents.filter(
    (d) => d.ocr_status === "pending",
  ).length;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Typography variant="h5" sx={{ flex: 1, fontWeight: 700 }}>
          Documents
          {pendingCount > 0 && (
            <Chip
              label={`${pendingCount} pending OCR`}
              size="small"
              color="warning"
              sx={{ ml: 1 }}
            />
          )}
        </Typography>
        <LinkButton href="/documents/upload" variant="contained" size="small">
          Upload
        </LinkButton>
      </Box>

      {documents.length === 0 ? (
        <Typography color="text.secondary">
          No documents yet.{" "}
          <NavLink href="/documents/upload">Upload the first one.</NavLink>
        </Typography>
      ) : (
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>File name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>OCR status</TableCell>
                <TableCell>Event</TableCell>
                <TableCell>Size</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {documents.map((doc) => (
                <LinkRow
                  key={doc.id}
                  hover
                  sx={{ cursor: "pointer" }}
                  href={`/documents/${doc.id}`}
                >
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {doc.created_at.slice(0, 10)}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {doc.file_name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {DOC_TYPE_LABEL[doc.doc_type] ?? doc.doc_type}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={doc.ocr_status}
                      size="small"
                      color={OCR_STATUS_COLOR[doc.ocr_status] ?? "default"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{doc.events?.title ?? "—"}</TableCell>
                  <TableCell>{formatFileSize(doc.file_size_bytes)}</TableCell>
                </LinkRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </Box>
  );
}
