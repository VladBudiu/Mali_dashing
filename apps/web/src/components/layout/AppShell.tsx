"use client";

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { APP_NAME } from "@mali/config";
import SignOutButton from "@/components/auth/SignOutButton";
import BottomNav from "./BottomNav";
import SideNav, { SIDE_NAV_WIDTH } from "./SideNav";

/**
 * Responsive application chrome: a permanent side nav on desktop, a fixed bottom
 * nav on mobile, and a top app bar. Wraps all authenticated app routes and
 * surfaces the active organization and sign-out control.
 */
export default function AppShell({
  children,
  userEmail,
  orgName,
}: {
  children: React.ReactNode;
  userEmail: string;
  orgName: string | null;
}) {
  return (
    <Box sx={{ display: "flex", minHeight: "100dvh" }}>
      <SideNav />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${SIDE_NAV_WIDTH}px)` },
          pb: { xs: 9, md: 0 },
        }}
      >
        <AppBar
          position="sticky"
          color="default"
          elevation={0}
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Toolbar sx={{ gap: 2 }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, display: { md: "none" } }}
            >
              {APP_NAME}
            </Typography>
            <Box
              sx={{
                ml: "auto",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              {orgName ? (
                <Chip
                  label={orgName}
                  size="small"
                  sx={{ display: { xs: "none", sm: "inline-flex" } }}
                />
              ) : null}
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ display: { xs: "none", md: "block" } }}
              >
                {userEmail}
              </Typography>
              <SignOutButton />
            </Box>
          </Toolbar>
        </AppBar>
        <Box sx={{ p: { xs: 2, md: 3 } }}>{children}</Box>
      </Box>
      <BottomNav />
    </Box>
  );
}
