import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { APP_NAME } from "@mali/config";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
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
          <TextField label="Email" type="email" fullWidth disabled />
          <Button variant="contained" size="large" disabled fullWidth>
            Continue
          </Button>
          <Typography variant="caption" color="text.secondary">
            Authentication is wired up in Phase 2.
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
