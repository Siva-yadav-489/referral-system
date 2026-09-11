"use client";

import * as React from "react";
import Link from "next/link";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  BedSingle,
  Building2,
  LayoutDashboard,
  MessageSquare,
  Receipt,
} from "lucide-react";

const navItems = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    title: "Properties",
    url: "/admin/properties",
    icon: Building2,
    exact: false,
  },
  {
    title: "Bookings",
    url: "/admin/bookings",
    icon: BedSingle,
    exact: false,
  },
  {
    title: "Billing",
    url: "/admin/billing",
    icon: Receipt,
    exact: false,
  },
  {
    title: "Enquiries",
    url: "/admin/enquiries",
    icon: MessageSquare,
    exact: false,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      collapsible="icon"
      {...props}
      className="bg-gray-100 dark:bg-background"
    >
      <SidebarHeader className="bg-gray-100 dark:bg-background">
        <SidebarMenu>
          {/* Expanded sidebar */}
          <SidebarMenuItem className="relative flex items-center group-data-[collapsible=icon]:hidden">
            <SidebarMenuButton
              size="lg"
              className="font-semibold data-[slot=sidebar-menu-button]:p-1.5"
              render={<Link href="/" />}
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Building2 className="size-4 shrink-0" />
              </div>

              <span className="tracking-tight">Beyond Stays</span>
            </SidebarMenuButton>

            <SidebarTrigger className="cursor-pointer" />
          </SidebarMenuItem>

          {/* Collapsed sidebar */}
          <SidebarMenuItem className="relative hidden group-data-[collapsible=icon]:block">
            <div className="relative flex h-8 w-full items-center justify-center">
              {/* Building icon */}
              <div className="absolute flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity duration-150 hover:opacity-0">
                <Building2 className="size-4" />
              </div>

              {/* Trigger */}
              <SidebarTrigger className="absolute size-8.5 cursor-pointer opacity-0 transition-opacity duration-150 hover:opacity-100" />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="bg-gray-100 dark:bg-background">
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter className="bg-gray-100 dark:bg-background">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
