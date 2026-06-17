import type { Metadata } from "next";
import Link from "next/link";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import MuiLink from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { resolveCurrentOrg } from "@/lib/org/membership";
import { listEvents } from "@/lib/events/queries";
import { uploadDocument } from "@/lib/documents/actions";
import UploadForm from "@/components/documents/UploadForm";

export const metadata: Metadata = { title: "Upload Document" };

export default async function UploadDocumentPage() {
  const currentOrg = await resolveCurrentOrg();
  if (!currentOrg) return null;

  const events = await listEvents(currentOrg.organizationId);
  const eventOptions = events.map((e) => ({ id: e.id, title: e.title }));

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Breadcrumbs>
        <MuiLink component={Link} href="/documents" underline="hover" color="inherit">
          Documents
        </MuiLink>
        <Typography color="text.primary">Upload</Typography>
      </Breadcrumbs>

      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        Upload document
      </Typography>

      <UploadForm action={uploadDocument} events={eventOptions} />
    </Box>
  );
}
