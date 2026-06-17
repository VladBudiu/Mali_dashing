import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CollaboratorForm from "@/components/collaborators/CollaboratorForm";
import { createCollaborator } from "@/lib/collaborators/actions";

export const metadata: Metadata = { title: "New Collaborator" };

export default function NewCollaboratorPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" component="h1" sx={{ mb: 3 }}>
        New collaborator
      </Typography>
      <CollaboratorForm action={createCollaborator} cancelHref="/collaborators" />
    </Box>
  );
}
