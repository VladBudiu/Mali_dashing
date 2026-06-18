"use client";

import { useState, useRef, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { sendAssistantMessage } from "@/lib/assistant/actions";
import type { AssistantSource } from "@/lib/assistant/types";
import { NavLink } from "@/components/ui/NavLink";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  sources?: AssistantSource[];
};

const SUGGESTIONS = [
  "What's my net balance this year?",
  "Which inventory items are low or out of stock?",
  "Show my upcoming events",
];

export default function AssistantChat({
  sessionId: initialSessionId,
  initialMessages,
}: {
  sessionId: string | null;
  initialMessages: ChatMessage[];
}) {
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  const submit = async (text: string) => {
    const question = text.trim();
    if (!question || pending) return;
    setError(null);
    setInput("");
    setMessages((m) => [...m, { role: "user", content: question }]);
    setPending(true);
    try {
      const res = await sendAssistantMessage(sessionId, question);
      if (res.status === "error") {
        setError(res.message);
      } else {
        setSessionId(res.sessionId);
        setMessages((m) => [...m, { role: "assistant", content: res.answer, sources: res.sources }]);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, height: "100%" }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, flex: 1 }}>
        {messages.length === 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, py: 2 }}>
            <Typography color="text.secondary" variant="body2">
              Ask about your events, finances, inventory, clients, or collaborators.
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {SUGGESTIONS.map((s) => (
                <Chip key={s} label={s} variant="outlined" size="small" onClick={() => submit(s)} />
              ))}
            </Box>
          </Box>
        )}

        {messages.map((m, i) => (
          <Box
            key={i}
            sx={{
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <Paper
              variant="outlined"
              sx={{
                p: 1.5,
                maxWidth: "85%",
                bgcolor: m.role === "user" ? "primary.main" : "background.paper",
                color: m.role === "user" ? "primary.contrastText" : "text.primary",
              }}
            >
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                {m.content}
              </Typography>
              {m.sources && m.sources.length > 0 && (
                <Box sx={{ mt: 1, display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                  {m.sources
                    .filter((s) => s.href)
                    .map((s, j) => (
                      <NavLink
                        key={`${s.table}-${s.id}-${j}`}
                        href={s.href as string}
                        underline="none"
                      >
                        <Chip size="small" variant="outlined" label={s.label} clickable />
                      </NavLink>
                    ))}
                </Box>
              )}
            </Paper>
          </Box>
        ))}

        {pending && (
          <Typography variant="body2" color="text.secondary">
            Thinking…
          </Typography>
        )}
        {error && (
          <Typography variant="body2" color="error.main">
            {error}
          </Typography>
        )}
        <div ref={endRef} />
      </Box>

      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
        sx={{ display: "flex", gap: 1, position: "sticky", bottom: 0 }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Ask a question…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={pending}
        />
        <Button type="submit" variant="contained" disabled={pending || !input.trim()}>
          Send
        </Button>
      </Box>
    </Box>
  );
}
