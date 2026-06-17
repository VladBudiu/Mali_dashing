import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import PageHeader from "@/components/ui/PageHeader";
import SignOutButton from "@/components/auth/SignOutButton";
import OrgSwitcher from "@/components/org/OrgSwitcher";
import { getCurrentUser } from "@/lib/auth/session";
import { listUserOrganizations, resolveCurrentOrg } from "@/lib/org/membership";

export const metadata: Metadata = { title: "Settings" };

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        {children}
      </Stack>
    </Paper>
  );
}

export default async function SettingsPage() {
  const [user, memberships, currentOrg] = await Promise.all([
    getCurrentUser(),
    listUserOrganizations(),
    resolveCurrentOrg(),
  ]);

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Settings"
        subtitle="Organization, members, and your account."
      />

      <SettingsSection title="Account">
        <Typography variant="body2" color="text.secondary">
          Signed in as <strong>{user?.email ?? "unknown"}</strong>
        </Typography>
        <Box>
          <SignOutButton />
        </Box>
      </SettingsSection>

      <SettingsSection title="Organization">
        <OrgSwitcher
          memberships={memberships}
          currentOrgId={currentOrg?.organizationId ?? ""}
        />
        <Divider />
        <Typography variant="caption" color="text.secondary">
          Fiscal configuration and member management arrive in a later phase.
        </Typography>
      </SettingsSection>
    </Stack>
  );
}
