
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/types";
import { cn } from "@/lib/utils";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarGroupLabel, 
  useSidebar,
} from "@/components/ui/sidebar";
import { ChevronDown, ChevronRight } from "lucide-react";
import React, { useState, useEffect } from "react";

interface MainNavProps {
  items: NavItem[];
}

const calculateIsActive = (navItemHref: string, currentPathname: string, children?: NavItem[]): boolean => {
  if (navItemHref === "/" && currentPathname === "/") return true;
  // Exact match or prefix match for parent items
  if (navItemHref !== "/" && currentPathname.startsWith(navItemHref)) return true;

  if (children && children.length > 0) {
    return children.some(child => calculateIsActive(child.href, currentPathname, child.children));
  }
  return false;
};


export function MainNav({ items }: MainNavProps) {
  const pathname = usePathname();
  const { state: sidebarState } = useSidebar();
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const initiallyOpen: Record<string, boolean> = {};
    items.forEach(item => {
      if (item.children && item.children.length > 0) {
        const isParentActive = calculateIsActive(item.href, pathname, item.children);
        if (isParentActive) {
          initiallyOpen[item.href] = true;
        }
      }
    });
    setOpenItems(prev => ({ ...prev, ...initiallyOpen }));
  }, [sidebarState, items, pathname]);


  const toggleOpen = (href: string) => {
    if (sidebarState === 'collapsed') return;
    setOpenItems((prev) => ({ ...prev, [href]: !prev[href] }));
  };

  if (!items?.length) {
    return null;
  }

  return (
    <SidebarMenu className="gap-1">
      {items.map((item, index) => {
        const Icon = item.icon;
        const isActive = calculateIsActive(item.href, pathname, item.children);
        const isOpen = openItems[item.href] || false;
        const buttonSize = item.children && item.children.length > 0 ? "default" : "default";


        if (item.children && item.children.length > 0) {
          let currentGroup: string | undefined = undefined;
          return (
            <SidebarMenuItem key={item.href} className="flex flex-col items-start w-full">
              <SidebarMenuButton
                variant="default"
                size={buttonSize}
                className={cn(
                  "justify-between w-full",
                   (isActive || (isOpen && sidebarState !== 'collapsed')) ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
                isActive={isActive || (isOpen && sidebarState !== 'collapsed')}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent event bubbling to parent if nested
                  toggleOpen(item.href);
                }}
                tooltip={{ children: item.title, className: "text-xs" }}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                </div>
                {sidebarState !== 'collapsed' && (
                  isOpen ? <ChevronDown className="h-4 w-4 group-data-[collapsible=icon]:hidden" /> : <ChevronRight className="h-4 w-4 group-data-[collapsible=icon]:hidden" />
                )}
              </SidebarMenuButton>
              {isOpen && sidebarState !== 'collapsed' && (
                <SidebarMenuSub className="mt-1 ml-2 w-[calc(100%-0.5rem)] border-l-0 pl-1.5 py-0.5 space-y-0.5">
                  {item.children.map((child) => {
                    const ChildIcon = child.icon;
                    const isChildActive = calculateIsActive(child.href, pathname, child.children);
                    let groupLabel = null;

                    if (child.group && child.group !== currentGroup) {
                      currentGroup = child.group;
                      groupLabel = (
                        <SidebarGroupLabel className="px-2 pt-2 pb-1 text-xs font-medium text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
                          {currentGroup}
                        </SidebarGroupLabel>
                      );
                    }
                     return (
                      <React.Fragment key={child.href}>
                        {groupLabel}
                        <SidebarMenuItem className="w-full">
                          <Link href={child.href} > {/* Removed asChild */}
                            <SidebarMenuSubButton
                              className={cn(
                                "w-full justify-start py-1.5 px-2", // Ensure class is applied for styling
                                isChildActive ? "bg-sidebar-accent/60 text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                              )}
                              isActive={isChildActive}
                              size="sm"
                            >
                              <ChildIcon className="h-4 w-4 mr-2" />
                              <span className="group-data-[collapsible=icon]:hidden text-sm">{child.title}</span>
                            </SidebarMenuSubButton>
                          </Link>
                        </SidebarMenuItem>
                      </React.Fragment>
                    );
                  })}
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>
          );
        }

        // Leaf item (no children) at top level
        return (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href}> {/* Removed asChild and legacyBehavior */}
              <SidebarMenuButton
                variant="default"
                size={buttonSize}
                className={cn(
                  "justify-start",
                  isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
                isActive={isActive}
                tooltip={{ children: item.title, className: "text-xs" }}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                </div>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
