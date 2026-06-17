import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { resolveCurrentOrg } from "@/lib/org/membership";
import { getClient } from "@/lib/clients/queries";
import { updateClient } from "@/lib/clients/actions";
import ClientForm from "@/components/clients/ClientForm";

export const metadata: Metadata = { title: "Edit Client" };

type Props = { params: Promise<{ id: string }> };

export default async function EditClientPage({ params }: Props) {
  const { id } = await params;
  const currentOrg = await resolveCurrentOrg();
  if (!currentOrg) notFound();

  const client = await getClient(currentOrg.organizationId, id);
  if (!client) notFound();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" component="h1" sx={{ mb: 3 }}>
        Edit — {client.name}
      </Typography>
      <ClientForm
        action={updateClient}
        client={client}
        cancelHref={`/clients/${client.id}`}
      />
    </Box>
  );
}
