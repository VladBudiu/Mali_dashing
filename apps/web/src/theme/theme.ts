"use client";

import { createTheme } from "@mui/material/styles";

/**
 * Mobile-first MUI theme for Mali Dash. Kept intentionally minimal in Phase 1;
 * brand tokens and component overrides are layered in as the design system grows.
 */
export const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: "light",
    primary: { main: "#6750a4" },
    secondary: { main: "#625b71" },
    background: { default: "#fdfcff" },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily:
      'var(--font-app), system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  },
});

export default theme;
