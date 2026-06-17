import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { resolveCurrentOrg } from "@/lib/org/membership";
import { getCollaborator, getCollaboratorRates } from "@/lib/collaborators/queries";
import { deleteCollaborator } from "@/lib/collaborators/actions";
import Button from "@mui/material/Button";
import { LinkButton } from "@/components/ui/LinkButton";

export const metadata: Metadata = { title: "Collaborator" };

type Props = { params: Promise<{ id: string }> };

export default async function CollaboratorDetailPage({ params }: Props) {
  const { id } = await params;
  const currentOrg = await resolveCurrentOrg();
  if (!currentOrg) notFound();

  const [collaborator, rates] = await Promise.all([
    getCollaborator(currentOrg.organizationId, id),
    getCollaboratorRates(id),
  ]);
  if (!collaborator) notFound();

  const canDelete = currentOrg.role === "owner";

  return (
    <Box sx={{ p: 3, maxWidth: 680 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <Typography variant="h5" component="h1">{collaborator.name}</Typography>
        {!collaborator.is_active && <Chip label="Inactive" size="small" />}
      </Box>
      {collaborator.specialty && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          {collaborator.specialty}
        </Typography>
      )}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Added {new Date(collaborator.created_at).toLocaleDateString("ro-RO")}
      </Typography>

      <Divider sx={{ mb: 2 }} />

      <Box sx={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 1.5, mb: 3 }}>
        {collaborator.phone && (
          <>
            <Typography variant="body2" color="text.secondary">Phone</Typography>
            <Typography variant="body2">{collaborator.phone}</Typography>
          </>
        )}
        {collaborator.email && (
          <>
            <Typography variant="body2" color="text.secondary">Email</Typography>
            <Typography variant="body2">{collaborator.email}</Typography>
          </>
        )}
        {collaborator.notes && (
          <>
            <Typography variant="body2" color="text.secondary">Notes</Typography>
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{collaborator.notes}</Typography>
          </>
        )}
      </Box>

      {rates.length > 0 && (
        <>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Rates</Typography>
          <Table size="small" sx={{ mb: 3 }}>
            <TableHead>
              <TableRow>
                <TableCell>Mode</TableCell>
                <TableCell align="right">Rate</TableCell>
                <TableCell>Currency</TableCell>
                <TableCell>Valid from</TableCell>
                <TableCell>Valid until</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rates.map((rate) => (
                <TableRow key={rate.id}>
                  <TableCell>{rate.pricing_mode.replace("_", " ")}</TableCell>
                  <TableCell align="right">{rate.rate}</TableCell>
                  <TableCell>{rate.currency}</TableCell>
                  <TableCell>{rate.valid_from}</TableCell>
                  <TableCell>{rate.valid_until ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}

      <Box sx={{ display: "flex", gap: 1 }}>
        <LinkButton variant="outlined" href={`/collaborators/${collaborator.id}/edit`}>
          Edit
        </LinkButton>
        <LinkButton variant="outlined" href="/collaborators">
          Back
        </LinkButton>
        {canDelete && (
          <form action={deleteCollaborator.bind(null, collaborator.id)}>
            <Button type="submit" variant="outlined" color="error">
              Delete
            </Button>
          </form>
        )}
      </Box>
    </Box>
  );
}
