"use client";

import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function SiteHeader({ title }: { title?: string }) {
  const pathname = usePathname();

  const currentTitle =
    title ||
    (pathname.includes("/referrals")
      ? "Referrals"
      : pathname.includes("/occupancy")
        ? "Occupancy"
        : "Dashboard");

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-2 px-4 lg:gap-3 lg:px-6">
        <SidebarTrigger className="-ml-1 cursor-pointer" />
        <Separator
          orientation="vertical"
          className="mx-1 h-4 data-vertical:self-auto"
        />
        <h1 className="text-base font-semibold tracking-tight">
          {currentTitle}
        </h1>
      </div>
    </header>
  );
}
