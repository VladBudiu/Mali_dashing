import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Chip from "@mui/material/Chip";
import { resolveCurrentOrg } from "@/lib/org/membership";
import { listCollaborators } from "@/lib/collaborators/queries";
import { LinkButton } from "@/components/ui/LinkButton";
import { LinkListItemButton } from "@/components/ui/LinkListItemButton";

export const metadata: Metadata = { title: "Collaborators" };

export default async function CollaboratorsPage() {
  const currentOrg = await resolveCurrentOrg();
  const collaborators = currentOrg
    ? await listCollaborators(currentOrg.organizationId)
    : [];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5" component="h1">Collaborators</Typography>
        <LinkButton variant="contained" href="/collaborators/new">
          Add collaborator
        </LinkButton>
      </Box>

      {collaborators.length === 0 ? (
        <Typography color="text.secondary">
          No collaborators yet. Add people you work with on events.
        </Typography>
      ) : (
        <List disablePadding sx={{ border: 1, borderColor: "divider", borderRadius: 1 }}>
          {collaborators.map((collab, index) => (
            <ListItem
              key={collab.id}
              disablePadding
              divider={index < collaborators.length - 1}
            >
              <LinkListItemButton href={`/collaborators/${collab.id}`}>
                <ListItemText
                  primary={collab.name}
                  secondary={collab.specialty ?? undefined}
                />
                {!collab.is_active && (
                  <Chip label="Inactive" size="small" sx={{ ml: 1 }} />
                )}
              </LinkListItemButton>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}
