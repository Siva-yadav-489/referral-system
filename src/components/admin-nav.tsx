"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Building2, BedSingle, Receipt } from "lucide-react";

export function AdminNav() {
  const pathname = usePathname();

  const links = [
    {
      href: "/admin",
      label: "Dashboard",
      icon: LayoutDashboard,
      active: pathname === "/admin",
    },
    {
      href: "/admin/properties",
      label: "Properties",
      icon: Building2,
      active: pathname.startsWith("/admin/properties"),
    },
    {
      href: "/admin/bookings",
      label: "Bookings",
      icon: BedSingle,
      active: pathname.startsWith("/admin/bookings"),
    },
    {
      href: "/admin/billing",
      label: "Billing & Invoices",
      icon: Receipt,
      active: pathname.startsWith("/admin/billing"),
    },
  ];

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 border-b border-border/80 mb-8 pb-3 overflow-x-auto scrollbar-none">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              link.active
                ? "bg-primary/15 text-primary border border-primary/30 shadow-sm shadow-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent"
            }`}
          >
            <Icon className="w-4 h-4" />
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
