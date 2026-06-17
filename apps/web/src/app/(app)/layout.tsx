import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { getCurrentUser } from "@/lib/auth/session";
import { resolveCurrentOrg } from "@/lib/org/membership";
import { LOGIN_PATH } from "@/lib/auth/constants";

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(LOGIN_PATH);
  }

  const currentOrg = await resolveCurrentOrg();

  return (
    <AppShell
      userEmail={user.email ?? ""}
      orgName={currentOrg?.organizationName ?? null}
    >
      {children}
    </AppShell>
  );
}
