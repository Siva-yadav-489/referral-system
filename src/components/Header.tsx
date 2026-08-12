"use client";

import Link from "next/link";
import { useSession, signOut } from "@/lib/auth-client";
import { Building2, DoorOpen, Gift, LogOut, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

interface HeaderProps {
  showAuthButtons?: boolean;
  showSignOut?: boolean;
}

export function Header({ showAuthButtons = true }: HeaderProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const isAdmin = session?.user.role === "ADMIN";

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-indigo-600 via-violet-600 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-white tracking-tight text-lg leading-none">
              StayHub{" "}
              <span className="text-indigo-400 text-xs font-semibold uppercase tracking-wider">
                PG
              </span>
            </span>
          </div>
        </Link>

        {showAuthButtons && (
          <div className="flex items-center gap-2 sm:gap-3">
            {isAdmin ? (
              <Link
                href="/admin"
                className="text-xs sm:text-sm font-medium text-zinc-300 hover:text-white px-3 py-2 rounded-xl transition-all flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-400" /> Admin
              </Link>
            ) : (
              <>
                <Link
                  href="/dashboard/occupancy"
                  className="text-xs sm:text-sm font-medium text-zinc-300 hover:text-white px-3 py-2 rounded-xl transition-all flex items-center gap-1.5"
                >
                  <DoorOpen className="w-4 h-4 text-indigo-400" />
                  <span className="hidden xs:inline">PG</span> Occupancy
                </Link>
                <Link
                  href="/dashboard/referrals"
                  className="text-xs sm:text-sm font-medium text-zinc-300 hover:text-white px-3 py-2 rounded-xl transition-all flex items-center gap-1.5"
                >
                  <Gift className="w-4 h-4 text-violet-400" /> Referrals
                </Link>
              </>
            )}
            {session?.user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden md:flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1.5 text-xs text-zinc-300">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[10px]">
                    {session.user.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <span className="font-medium">{session.user.name}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-medium px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs sm:text-sm font-medium text-zinc-300 hover:text-white px-3 py-2 rounded-xl transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-medium px-4 py-2 rounded-xl transition-all shadow-lg shadow-indigo-600/20"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
