import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { resolveCurrentOrg } from "@/lib/org/membership";
import { getCollaborator } from "@/lib/collaborators/queries";
import { updateCollaborator } from "@/lib/collaborators/actions";
import CollaboratorForm from "@/components/collaborators/CollaboratorForm";

export const metadata: Metadata = { title: "Edit Collaborator" };

type Props = { params: Promise<{ id: string }> };

export default async function EditCollaboratorPage({ params }: Props) {
  const { id } = await params;
  const currentOrg = await resolveCurrentOrg();
  if (!currentOrg) notFound();

  const collaborator = await getCollaborator(currentOrg.organizationId, id);
  if (!collaborator) notFound();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" component="h1" sx={{ mb: 3 }}>
        Edit — {collaborator.name}
      </Typography>
      <CollaboratorForm
        action={updateCollaborator}
        collaborator={collaborator}
        cancelHref={`/collaborators/${collaborator.id}`}
      />
    </Box>
  );
}
