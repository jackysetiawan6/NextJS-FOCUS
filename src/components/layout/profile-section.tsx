"use client";

import { UserCircle } from "lucide-react";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserUser, type UserSession } from "@/utils/auth-client";

export function ProfileSection() {
  const [user, setUser] = useState<UserSession | null>(null);
  const router = useRouter();

  useEffect(() => {
    const activeUser = getBrowserUser();
    if (!activeUser) {
      router.push("/login");
    } else {
      setUser(activeUser);
    }
  }, [router]);

  if (!user) {
    return null;
  }

  return (
    <SidebarMenuButton
      className="justify-start w-full cursor-default"
      tooltip={{ children: user.email, className: "text-xs" }}
    >
      <UserCircle className="h-5 w-5" />
      <span className="group-data-[collapsible=icon]:hidden">
        {user.full_name || "Unidentified User"}
      </span>
    </SidebarMenuButton>
  );
}