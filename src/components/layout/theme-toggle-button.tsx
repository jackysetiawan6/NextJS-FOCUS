
"use client";

import { useEffect, useState } from "react"; // Added imports
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { SidebarMenuButton } from "@/components/ui/sidebar";

export function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine which theme to use for rendering.
  // Before mount (and on server), use a fixed theme that matches the server's default.
  // Your ThemeProvider in src/app/layout.tsx sets defaultTheme="dark".
  const renderTheme = mounted ? theme : 'dark';

  const IconComponentToRender = renderTheme === 'light' ? Moon : Sun;
  const buttonTextToDisplay = renderTheme === 'light' ? "Dark Mode" : "Light Mode";
  const tooltipText = `Switch to ${renderTheme === 'light' ? 'dark' : 'light'} mode`;

  return (
    <SidebarMenuButton
      className="justify-start w-full"
      onClick={toggleTheme} // This will use the actual 'theme' from context when clicked
      tooltip={{ children: tooltipText, className: "text-xs" }}
    >
      <IconComponentToRender className="h-5 w-5" />
      <span className="group-data-[collapsible=icon]:hidden">
        {buttonTextToDisplay}
      </span>
      <span className="sr-only">Toggle theme</span>
    </SidebarMenuButton>
  );
}
