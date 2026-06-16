"use client";

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { APP_NAME } from "@mali/config";
import BottomNav from "./BottomNav";
import SideNav, { SIDE_NAV_WIDTH } from "./SideNav";

/**
 * Responsive application chrome: a permanent side nav on desktop, a fixed bottom
 * nav on mobile, and a top app bar. Wraps all authenticated app routes.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
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
          <Toolbar>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, display: { md: "none" } }}
            >
              {APP_NAME}
            </Typography>
          </Toolbar>
        </AppBar>
        <Box sx={{ p: { xs: 2, md: 3 } }}>{children}</Box>
      </Box>
      <BottomNav />
    </Box>
  );
}
