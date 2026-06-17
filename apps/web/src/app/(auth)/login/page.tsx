import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { APP_NAME } from "@mali/config";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const redirectTo = firstParam(params.redirectTo);
  const initialError = firstParam(params.error);

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        p: 2,
      }}
    >
      <Paper variant="outlined" sx={{ p: 4, width: "100%", maxWidth: 400 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {APP_NAME}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in to your workspace
            </Typography>
          </Box>
          <LoginForm redirectTo={redirectTo} initialError={initialError} />
        </Stack>
      </Paper>
    </Box>
  );
}
