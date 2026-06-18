import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { resolveCurrentOrg } from "@/lib/org/membership";
import { listSessions, getMessages } from "@/lib/assistant/history";
import AssistantChat from "@/components/assistant/AssistantChat";
import { LinkButton } from "@/components/ui/LinkButton";
import { NavLink } from "@/components/ui/NavLink";

export const metadata: Metadata = { title: "Assistant" };
export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ session?: string }> };

export default async function AssistantPage({ searchParams }: PageProps) {
  const { session } = await searchParams;
  const currentOrg = await resolveCurrentOrg();
  if (!currentOrg) return null;

  const sessions = await listSessions(currentOrg.organizationId);
  const activeId = session ?? sessions[0]?.id ?? null;
  const messages = activeId ? await getMessages(activeId) : [];

  const initialMessages = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, height: "calc(100dvh - 140px)" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 700, flex: 1 }}>
          Assistant
        </Typography>
        <LinkButton href="/assistant" variant="outlined" size="small">
          New chat
        </LinkButton>
      </Box>

      {sessions.length > 0 && (
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          {sessions.slice(0, 8).map((s) => (
            <NavLink
              key={s.id}
              href={`/assistant?session=${s.id}`}
              underline="hover"
              color={s.id === activeId ? "primary" : "text.secondary"}
              sx={{ fontSize: 13 }}
            >
              {s.title ?? "Untitled chat"}
            </NavLink>
          ))}
        </Box>
      )}

      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        <AssistantChat
          key={activeId ?? "new"}
          sessionId={activeId}
          initialMessages={initialMessages}
        />
      </Box>
    </Box>
  );
}
