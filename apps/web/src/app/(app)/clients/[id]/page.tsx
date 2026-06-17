import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import { resolveCurrentOrg } from "@/lib/org/membership";
import { getClient } from "@/lib/clients/queries";
import { deleteClient } from "@/lib/clients/actions";

export const metadata: Metadata = { title: "Client" };

type Props = { params: Promise<{ id: string }> };

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params;
  const currentOrg = await resolveCurrentOrg();
  if (!currentOrg) notFound();

  const client = await getClient(currentOrg.organizationId, id);
  if (!client) notFound();

  const canDelete = currentOrg.role === "owner";

  return (
    <Box sx={{ p: 3, maxWidth: 640 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <Typography variant="h5" component="h1">{client.name}</Typography>
        <Chip label={client.type} size="small" variant="outlined" />
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Added {new Date(client.created_at).toLocaleDateString("ro-RO")}
      </Typography>

      <Divider sx={{ mb: 2 }} />

      <Box sx={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 1.5, mb: 3 }}>
        {client.tax_id && (
          <>
            <Typography variant="body2" color="text.secondary">Tax ID</Typography>
            <Typography variant="body2">{client.tax_id}</Typography>
          </>
        )}
        {client.phone && (
          <>
            <Typography variant="body2" color="text.secondary">Phone</Typography>
            <Typography variant="body2">{client.phone}</Typography>
          </>
        )}
        {client.email && (
          <>
            <Typography variant="body2" color="text.secondary">Email</Typography>
            <Typography variant="body2">{client.email}</Typography>
          </>
        )}
        {client.notes && (
          <>
            <Typography variant="body2" color="text.secondary">Notes</Typography>
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{client.notes}</Typography>
          </>
        )}
      </Box>

      <Box sx={{ display: "flex", gap: 1 }}>
        <Button variant="outlined" component={Link} href={`/clients/${client.id}/edit`}>
          Edit
        </Button>
        <Button variant="outlined" component={Link} href="/clients">
          Back to clients
        </Button>
        {canDelete && (
          <form action={deleteClient.bind(null, client.id)}>
            <Button type="submit" variant="outlined" color="error">
              Delete
            </Button>
          </form>
        )}
      </Box>
    </Box>
  );
}
