
"use client"; 

import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { format } from 'date-fns';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarMenuButton,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { MainNav } from "@/components/layout/main-nav";
import { mainNavItems } from "@/config/nav";
import { LogOut, Sun, Moon } from "lucide-react"; 
import Link from "next/link";
import { ThemeToggleButton } from "@/components/layout/theme-toggle-button";
import { useTheme } from "@/components/theme-provider";
import { logOut } from "@/app/(auth)/actions";
import { ProfileSection } from "@/components/layout/profile-section";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [currentDate, setCurrentDate] = useState("");
  const [currentTimeDisplay, setCurrentTimeDisplay] = useState("");
  const [currentAmPm, setCurrentAmPm] = useState("");

  // For mobile header
  const [mobileDate, setMobileDate] = useState("");
  const [mobileTime, setMobileTime] = useState("");

  const { theme } = useTheme(); 
  const appVersion = "v1.0.1";

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      // Formats for the new sidebar widget
      setCurrentDate(format(now, 'eeee, MMMM do, yyyy'));
      setCurrentTimeDisplay(format(now, 'hh:mm')); // 12-hour format without seconds
      setCurrentAmPm(format(now, 'a')); // AM/PM

      // Formats for the mobile header
      setMobileDate(format(now, 'eeee, MMMM do, yyyy'));
      setMobileTime(format(now, 'hh:mm:ss a')); // 12-hour format with seconds, with AM/PM
    };
    updateDateTime();
    const timerId = setInterval(updateDateTime, 1000); 
    return () => clearInterval(timerId);
  }, []);

  const ThemeIcon = theme === 'dark' ? Moon : Sun;

  return (
    <SidebarProvider defaultOpen>
      <Sidebar variant="sidebar" collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
        <SidebarRail />
        <SidebarHeader className="p-4 flex flex-col items-start group-data-[collapsible=icon]:items-center">
          <Link href="/dashboard" className="mb-2 group-data-[collapsible=icon]:mb-0 flex items-baseline">
            <span className="font-bold text-2xl group-data-[collapsible=icon]:hidden">FOCUS</span>
            <span className="ml-1 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
              {appVersion}
            </span>
            <span className="font-bold text-2xl hidden group-data-[collapsible=icon]:block group-data-[collapsible=icon]:text-lg">F</span>
          </Link>
          
          {(currentDate && currentTimeDisplay && currentAmPm) && (
            <div className="group-data-[collapsible=icon]:hidden mt-3 w-full p-4 rounded-lg bg-primary text-primary-foreground relative shadow-md">
              <ThemeIcon className="absolute top-3 right-3 h-5 w-5" />
              <div className="flex items-baseline">
                <span className="text-5xl font-bold font-mono">{currentTimeDisplay}</span>
                <span className="text-2xl font-semibold ml-2">{currentAmPm}</span>
              </div>
              <div className="mt-1 text-md">
                {currentDate}
              </div>
            </div>
          )}
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent className="flex-1 p-2">
          <MainNav items={mainNavItems} />
        </SidebarContent>
        <SidebarSeparator />
        <SidebarFooter className="p-2">
            <ThemeToggleButton /> 
            <ProfileSection />
            <SidebarMenuButton
              className="justify-start w-full"
              tooltip={{children: "Logout", className: "text-xs"}}
              onClick={logOut}
            >
              <LogOut className="h-5 w-5" />
              <span className="group-data-[collapsible=icon]:hidden">Logout</span>
            </SidebarMenuButton>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        {/* Mobile Header with Hamburger Trigger */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background p-2 md:hidden">
          <div className="flex items-center">
            <SidebarTrigger />
            <div className="flex items-baseline">
              <span className="ml-3 font-bold text-lg">FOCUS</span>
              <span className="ml-1 text-xs text-muted-foreground">{appVersion}</span>
            </div>
          </div>
          {(mobileDate && mobileTime) && (
            <div className="text-xs mr-2 flex flex-col items-end">
              <span className="font-medium text-muted-foreground">{mobileDate}</span>
              <span className="font-mono text-base font-semibold text-foreground">{mobileTime}</span>
            </div>
          )}
        </div>
        <div className="p-4 md:p-6 lg:p-8 min-h-screen">
         {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
