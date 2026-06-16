import type { ComponentType } from "react";
import AssistantIcon from "@mui/icons-material/SmartToy";
import CalculateIcon from "@mui/icons-material/Calculate";
import CollaboratorsIcon from "@mui/icons-material/Groups";
import DashboardIcon from "@mui/icons-material/SpaceDashboard";
import DocumentsIcon from "@mui/icons-material/Description";
import EventsIcon from "@mui/icons-material/Event";
import FinanceIcon from "@mui/icons-material/Payments";
import InventoryIcon from "@mui/icons-material/Inventory2";
import ClientsIcon from "@mui/icons-material/People";
import SettingsIcon from "@mui/icons-material/Settings";

export type NavItem = {
  label: string;
  href: string;
  icon: ComponentType;
};

/** Primary navigation surfaced in the side nav (desktop) and bottom nav (mobile). */
export const PRIMARY_NAV_ITEMS: readonly NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: DashboardIcon },
  { label: "Events", href: "/events", icon: EventsIcon },
  { label: "Clients", href: "/clients", icon: ClientsIcon },
  { label: "Finance", href: "/finance", icon: FinanceIcon },
  { label: "Documents", href: "/documents", icon: DocumentsIcon },
  { label: "Inventory", href: "/inventory", icon: InventoryIcon },
  { label: "Collaborators", href: "/collaborators", icon: CollaboratorsIcon },
  { label: "Pricing", href: "/pricing", icon: CalculateIcon },
  { label: "Assistant", href: "/assistant", icon: AssistantIcon },
  { label: "Settings", href: "/settings", icon: SettingsIcon },
];

/** Condensed set shown in the mobile bottom navigation bar. */
export const BOTTOM_NAV_ITEMS: readonly NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: DashboardIcon },
  { label: "Events", href: "/events", icon: EventsIcon },
  { label: "Finance", href: "/finance", icon: FinanceIcon },
  { label: "Documents", href: "/documents", icon: DocumentsIcon },
  { label: "Assistant", href: "/assistant", icon: AssistantIcon },
];
