"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Building2,
  LayoutDashboard,
  BedSingle,
  Receipt,
  MessageSquare,
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

export function AdminSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

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

              <div className="flex flex-col text-left">
                <span className="tracking-tight font-bold">Beyond Stays</span>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                  Admin Console
                </span>
              </div>
            </SidebarMenuButton>

            <SidebarTrigger className="cursor-pointer" />
          </SidebarMenuItem>

          {/* Collapsed sidebar */}
          <SidebarMenuItem className="relative hidden group-data-[collapsible=icon]:block">
            <div className="relative flex h-8 w-full items-center justify-center">
              <div className="absolute flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity duration-150 hover:opacity-0">
                <Building2 className="size-4" />
              </div>

              <SidebarTrigger className="absolute size-8.5 cursor-pointer opacity-0 transition-opacity duration-150 hover:opacity-100" />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="bg-gray-100 dark:bg-background">
        <SidebarGroup className="bg-gray-100 dark:bg-background">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {navItems.map((item) => {
                const isActive = item.exact
                  ? pathname === item.url
                  : pathname === item.url ||
                    pathname.startsWith(`${item.url}/`);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.title}
                      className="font-medium data-active:text-teal-700 hover:data-active:dark:text-teal-700 hover:bg-white hover:dark:text-background hover:data-active:dark:bg-white data-active:bg-white data-active:shadow-sm data-active:hover:text-teal-700"
                      render={
                        <Link
                          href={item.url}
                          className="flex items-center gap-2.5 h-10"
                        />
                      }
                    >
                      <item.icon className="size-4.5 shrink-0" />
                      <span className="font-semibold">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-gray-100 dark:bg-background">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
