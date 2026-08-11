"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Sparkles, AlertCircle } from "lucide-react";
import { Header } from "@/components/Header";

function HomeContent() {
  const searchParams = useSearchParams();
  const hasInvalidRefError = searchParams.get("error") === "invalid_referral";

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-16 flex-1 flex flex-col items-center justify-center text-center">
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
        <Sparkles className="w-4 h-4 text-indigo-400" /> Instant 10 Points Bonus
        for Both Referrer & Referee
      </div>

      <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight max-w-3xl leading-tight">
        Supercharge your growth with{" "}
        <span className="bg-linear-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
          Smart Referrals
        </span>
        .
      </h1>

      <p className="text-zinc-400 text-base sm:text-lg max-w-xl mt-6 leading-relaxed">
        Invite your friends using your personal referral link. Both of you
        instantly get 10 points inside an atomic database transaction.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 w-full max-w-xs sm:max-w-none justify-center">
        <Link
          href="/signup"
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/25"
        >
          Create Account & Earn Points <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/dashboard"
          className="w-full sm:w-auto bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white font-medium px-6 py-3.5 rounded-xl text-sm transition-all text-center"
        >
          Go to Dashboard
        </Link>
      </div>

      {/* Features Cards */}
      {/* <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl w-full mt-20 text-left">
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mb-4">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">Atomic Transactions</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Points allocation and referral linkage happen inside a single Drizzle database transaction.
          </p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 flex items-center justify-center mb-4">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">Abuse Prevention</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Enforces anti-self-referral checks and lifetime single-referral rules out of the box.
          </p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-4">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">Referee Tracking</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Real-time dashboard displaying user points, custom referral link, and referee history.
          </p>
        </div>
      </div> */}
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
