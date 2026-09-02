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
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <Building2 className="w-5 h-5" />
          </div>

          <div className="flex flex-col">
            <span className="font-extrabold text-foreground tracking-tight text-lg leading-none">
              Beyond Stays
            </span>
          </div>
        </Link>

        {showAuthButtons && (
          <div className="flex items-center gap-2 sm:gap-3">
            {isAdmin ? (
              <Link
                href="/admin"
                className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent px-3 py-2 rounded-md transition-colors flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4 text-primary" />
                Admin
              </Link>
            ) : (
              <>
                <Link
                  href="/dashboard/occupancy"
                  className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent px-3 py-2 rounded-md transition-colors flex items-center gap-1.5"
                >
                  <DoorOpen className="w-4 h-4 text-primary" />
                  <span className="hidden xs:inline">PG</span>
                  Occupancy
                </Link>

                <Link
                  href="/dashboard/referrals"
                  className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent px-3 py-2 rounded-md transition-colors flex items-center gap-1.5"
                >
                  <Gift className="w-4 h-4 text-primary" />
                  Referrals
                </Link>
              </>
            )}

            {session?.user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden md:flex items-center gap-2 bg-muted border border-border rounded-full px-3 py-1.5 text-xs text-muted-foreground">
                  <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                    {session.user.name?.[0]?.toUpperCase() || "U"}
                  </div>

                  <span className="font-medium text-foreground">
                    {session.user.name}
                  </span>
                </div>

                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1.5 bg-background hover:bg-accent border border-border text-muted-foreground hover:text-foreground text-xs font-medium px-3.5 py-2 rounded-md transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm font-medium px-4 py-2 rounded-md transition-colors shadow-sm"
              >
                Get Started
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
