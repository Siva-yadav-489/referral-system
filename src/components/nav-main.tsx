"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { LucideIcon } from "lucide-react";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
  }[];
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup className="bg-gray-100 dark:bg-background">
      <SidebarGroupContent>
        <SidebarMenu className="gap-1">
          {items.map((item) => {
            const isActive =
              pathname === item.url || pathname.startsWith(`${item.url}/`);

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
  );
}
