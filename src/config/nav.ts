
import type { NavItem } from "@/types";
import {
  LayoutDashboard,
  ClipboardList,
  FileWarning,
  ClipboardSignature,
  ClipboardCheck,
  CalendarDays,
  AlertCircle, 
  Flame, 
  Wrench, 
  Tag,
  Package,
  ClipboardPaste,
} from "lucide-react";

export const mainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Shift Turnover",
    href: "/shift-turnover/site-condition/alarm-logs", // Default to first item
    icon: ClipboardList,
    children: [
      // Site Condition Group items
      {
        title: "Alarm Logs",
        href: "/shift-turnover/site-condition/alarm-logs",
        icon: AlertCircle,
        group: "Site Condition",
      },
      {
        title: "Fire System Isolations",
        href: "/shift-turnover/site-condition/fire-isolations",
        icon: Flame,
        group: "Site Condition",
      },
      {
        title: "Manual Operations",
        href: "/shift-turnover/site-condition/manual-operations",
        icon: Wrench,
        group: "Site Condition",
      },
      {
        title: "LOTO Tags",
        href: "/shift-turnover/site-condition/loto-tags",
        icon: Tag,
        group: "Site Condition",
      },
      // Other Tasks Group items
      {
        title: "Incident Management",
        href: "/shift-turnover/incident-management",
        icon: FileWarning,
        group: "Other Tasks",
      },
      {
        title: "Activity of The Day",
        href: "/shift-turnover/activity-of-the-day",
        icon: ClipboardCheck,
        group: "Other Tasks",
      },
    ],
  },
  {
    title: "Log Sheet", // Changed name and made top-level
    href: "/log-sheet",
    icon: ClipboardPaste, 
  },
  {
    title: "Roster Management",
    href: "/roster-management",
    icon: CalendarDays,
  },
  {
    title: "Inventory Management",
    href: "/inventory-management",
    icon: Package,
  },
];
