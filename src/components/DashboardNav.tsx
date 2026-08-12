"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DoorOpen, Gift } from "lucide-react";

export function DashboardNav() {
  const pathname = usePathname();

  const isOccupancy = pathname.startsWith("/dashboard/occupancy");
  const isReferrals = pathname.startsWith("/dashboard/referrals");

  return (
    <div className="flex items-center gap-2 border-b border-zinc-800/80 mb-8 pb-3">
      <Link
        href="/dashboard/occupancy"
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
          isOccupancy
            ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-md shadow-indigo-600/10"
            : "text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent"
        }`}
      >
        <DoorOpen className="w-4 h-4 text-indigo-400" />
        PG Occupancy
      </Link>

      <Link
        href="/dashboard/referrals"
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
          isReferrals
            ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-md shadow-indigo-600/10"
            : "text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent"
        }`}
      >
        <Gift className="w-4 h-4 text-indigo-400" />
        Referrals & Rewards
      </Link>
    </div>
  );
}
