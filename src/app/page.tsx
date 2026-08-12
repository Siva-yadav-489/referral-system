"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
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
        <div className="mb-8 p-4 bg-amber-950/60 border border-amber-500/40 rounded-2xl max-w-lg flex items-center gap-3 text-amber-300 text-xs sm:text-sm text-left shadow-xl backdrop-blur-md animate-fade-in">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <span className="font-bold text-amber-200">
              Invalid Referral Link
            </span>
            <p className="text-amber-300/80 mt-0.5">
              The referral code in your link does not exist. You can sign up
              below without a referral or request a new referral link!
            </p>
          </div>
        </div>
      )}

      <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
        <Sparkles className="w-4 h-4 text-indigo-400" /> Explore PG Occupancy &
        Earn 10+ Referral Points
      </div>

      <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight max-w-4xl leading-tight">
        Modern PG Living with{" "}
        <span className="bg-linear-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
          Smart Occupancy & Referrals
        </span>
      </h1>

      <p className="text-zinc-400 text-base sm:text-lg max-w-2xl mt-6 leading-relaxed">
        Explore floor-by-floor room availability, reserve single or shared PG
        beds in real-time, and earn instant rewards by inviting your friends!
      </p>

      {/* Role-specific dashboard actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3.5 mt-8 w-full max-w-md sm:max-w-none justify-center">
        {isAdmin ? (
          <Link href="/admin" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/25">
            <ShieldCheck className="w-4 h-4" /> Go to Admin Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <>
            <Link href="/dashboard/occupancy" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/25">
              <DoorOpen className="w-4 h-4" /> PG Occupancy & Beds <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/dashboard/referrals" className="w-full sm:w-auto bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-200 hover:text-white font-semibold px-6 py-3.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-xl">
              <Gift className="w-4 h-4 text-violet-400" /> Referral Dashboard
            </Link>
            <Link href="/signup" className="w-full sm:w-auto bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white font-medium px-6 py-3.5 rounded-xl text-sm transition-all text-center">
              Create Account
            </Link>
          </>
        )}
      </div>
    </main>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between">
      <Header />

      <Suspense
        fallback={
          <div className="text-white text-sm text-center py-20">Loading...</div>
        }
      >
        <HomeContent />
      </Suspense>
    </div>
  );
}
