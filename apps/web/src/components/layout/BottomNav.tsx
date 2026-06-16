"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Paper from "@mui/material/Paper";
import { BOTTOM_NAV_ITEMS } from "@/lib/navigation";

function findActiveHref(pathname: string): string | false {
  const match = BOTTOM_NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  return match ? match.href : false;
}

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <Paper
      elevation={3}
      sx={{
        display: { xs: "block", md: "none" },
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: (theme) => theme.zIndex.appBar,
      }}
    >
      <BottomNavigation showLabels value={findActiveHref(pathname)}>
        {BOTTOM_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <BottomNavigationAction
              key={item.href}
              label={item.label}
              value={item.href}
              icon={<Icon />}
              component={Link}
              href={item.href}
            />
          );
        })}
      </BottomNavigation>
    </Paper>
  );
}
