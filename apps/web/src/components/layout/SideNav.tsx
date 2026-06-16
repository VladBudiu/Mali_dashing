"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { APP_NAME } from "@mali/config";
import { PRIMARY_NAV_ITEMS } from "@/lib/navigation";

export const SIDE_NAV_WIDTH = 248;

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SideNav() {
  const pathname = usePathname();

  return (
    <Drawer
      variant="permanent"
      sx={{
        display: { xs: "none", md: "block" },
        width: SIDE_NAV_WIDTH,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: SIDE_NAV_WIDTH,
          boxSizing: "border-box",
        },
      }}
    >
      <Toolbar>
        <Typography variant="h6" noWrap sx={{ fontWeight: 700 }}>
          {APP_NAME}
        </Typography>
      </Toolbar>
      <Box sx={{ overflow: "auto" }}>
        <List>
          {PRIMARY_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <ListItemButton
                key={item.href}
                component={Link}
                href={item.href}
                selected={isActivePath(pathname, item.href)}
              >
                <ListItemIcon>
                  <Icon />
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            );
          })}
        </List>
      </Box>
    </Drawer>
  );
}
