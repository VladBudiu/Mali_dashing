import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import PageHeader from "@/components/ui/PageHeader";
import SignOutButton from "@/components/auth/SignOutButton";
import OrgSwitcher from "@/components/org/OrgSwitcher";
import OrgSettingsForm from "@/components/org/OrgSettingsForm";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getOrganization,
  listUserOrganizations,
  resolveCurrentOrg,
} from "@/lib/org/membership";
import { vatModeLabel } from "@/lib/org/settings";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

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

  const orgSettings = currentOrg
    ? await getOrganization(currentOrg.organizationId)
    : null;
  const isOwner = currentOrg?.role === "owner";

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
        {orgSettings && (
          <>
            <Divider />
            {isOwner ? (
              <OrgSettingsForm
                defaults={{
                  name: orgSettings.name,
                  vat_mode: orgSettings.vat_mode,
                  base_currency: orgSettings.base_currency,
                }}
              />
            ) : (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {orgSettings.name} · {vatModeLabel(orgSettings.vat_mode)} ·{" "}
                  {orgSettings.base_currency}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Only an owner can change organization settings.
                </Typography>
              </Box>
            )}
          </>
        )}
      </SettingsSection>
    </Stack>
  );
}
