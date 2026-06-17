import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ClientForm from "@/components/clients/ClientForm";
import { createClient } from "@/lib/clients/actions";

export const metadata: Metadata = { title: "New Client" };

export default function NewClientPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" component="h1" sx={{ mb: 3 }}>
        New client
      </Typography>
      <ClientForm action={createClient} cancelHref="/clients" />
    </Box>
  );
}
