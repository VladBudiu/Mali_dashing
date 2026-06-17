import type { Metadata } from "next";
import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Chip from "@mui/material/Chip";
import { resolveCurrentOrg } from "@/lib/org/membership";
import { listClients } from "@/lib/clients/queries";

export const metadata: Metadata = { title: "Clients" };

export default async function ClientsPage() {
  const currentOrg = await resolveCurrentOrg();
  const clients = currentOrg
    ? await listClients(currentOrg.organizationId)
    : [];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5" component="h1">Clients</Typography>
        <Button variant="contained" component={Link} href="/clients/new">
          Add client
        </Button>
      </Box>

      {clients.length === 0 ? (
        <Typography color="text.secondary">
          No clients yet. Add your first client to get started.
        </Typography>
      ) : (
        <List disablePadding sx={{ border: 1, borderColor: "divider", borderRadius: 1 }}>
          {clients.map((client, index) => (
            <ListItem
              key={client.id}
              disablePadding
              divider={index < clients.length - 1}
            >
              <ListItemButton component={Link} href={`/clients/${client.id}`}>
                <ListItemText
                  primary={client.name}
                  secondary={[client.email, client.phone].filter(Boolean).join(" · ") || undefined}
                />
                <Chip
                  label={client.type}
                  size="small"
                  variant="outlined"
                  sx={{ ml: 1 }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}
