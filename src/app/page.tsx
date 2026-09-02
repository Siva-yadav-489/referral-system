"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  AlertCircle,
  DoorOpen,
  Gift,
  ShieldCheck,
} from "lucide-react";
import { Header } from "@/components/Header";
import { useSession } from "@/lib/auth-client";

function HomeContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const hasInvalidRefError = searchParams.get("error") === "invalid_referral";

  const isAdmin = session?.user.role === "ADMIN";

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 flex-1 flex flex-col items-center justify-center text-center">
      {hasInvalidRefError && (
        <div className="mb-8 p-4 bg-destructive/10 border border-destructive/30 rounded-lg max-w-lg flex items-center gap-3 text-destructive text-xs sm:text-sm text-left shadow-sm backdrop-blur-md animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0" />

          <div>
            <span className="font-bold">Invalid Referral Link</span>

            <p className="mt-0.5 text-destructive/80">
              The referral code in your link does not exist. You can sign up
              below without a referral or request a new referral link!
            </p>
          </div>
        </div>
      )}

      <h1 className="text-4xl sm:text-6xl font-black text-foreground tracking-tight max-w-4xl leading-tight">
        Modern PG Living with{" "}
        <span className="text-primary">Smart Occupancy & Referrals</span>
      </h1>

      <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mt-6 leading-relaxed">
        Explore floor-by-floor room availability, reserve single or shared PG
        beds in real-time, and earn instant rewards by inviting your friends!
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3.5 mt-8 w-full max-w-md sm:max-w-none justify-center">
        {isAdmin ? (
          <Link
            href="/admin"
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <ShieldCheck className="w-4 h-4" />
            Go to Admin Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <>
            <Link
              href="/dashboard/occupancy"
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <DoorOpen className="w-4 h-4" />
              PG Occupancy & Beds
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/dashboard/referrals"
              className="w-full sm:w-auto bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border font-semibold px-6 py-3.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Gift className="w-4 h-4" />
              Referral Dashboard
            </Link>
          </>
        )}
      </div>
    </main>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <Suspense
        fallback={
          <div className="text-muted-foreground text-sm text-center py-20">
            Loading...
          </div>
        }
      >
        <HomeContent />
      </Suspense>
    </div>
  );
}
