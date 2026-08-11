"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import {
  getReferralDashboardData,
  ReferralDashboardData,
} from "@/app/actions/referral";
import {
  Gift,
  Copy,
  Check,
  Users,
  Sparkles,
  ArrowUpRight,
  UserCheck,
  RefreshCw,
} from "lucide-react";
import { Header } from "@/components/Header";

export default function DashboardPage() {
  const { data: session, isPending: sessionLoading } = useSession();
  const router = useRouter();

  const [dashboardData, setDashboardData] =
    useState<ReferralDashboardData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchDashboardData = async () => {
    setDataLoading(true);
    setError(null);
    try {
      const data = await getReferralDashboardData();
      setDashboardData(data);
    } catch (err: any) {
      console.error("Error fetching dashboard data:", err);
      setError(err?.message || "Failed to load dashboard data.");
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (!sessionLoading) {
      if (!session?.user) {
        router.push("/login");
      } else {
        fetchDashboardData();
      }
    }
  }, [session, sessionLoading, router]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const referralLink = dashboardData
    ? `${origin}/signup?ref=${dashboardData.referralCode}`
    : "";

  const handleCopyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (sessionLoading || (dataLoading && !dashboardData)) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-zinc-400">
          Loading your referral dashboard...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md text-center">
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-4 py-2 rounded-xl transition-all"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <Header />

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Welcome Hero Banner */}
        <div className="relative overflow-hidden bg-linear-to-r from-indigo-950/60 via-zinc-900 to-zinc-900 border border-indigo-500/20 rounded-3xl p-6 sm:p-8">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold px-3 py-1 rounded-full mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Earn 10 points per referral
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Share the love, earn rewards together.
            </h1>
            <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
              Invite friends using your unique referral code. Both you and your
              friend will instantly receive 10 points when they sign up!
            </p>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Points Balance */}
          <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Total Points
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-4xl font-extrabold text-white tracking-tight">
                {dashboardData?.points ?? 0}
              </div>
              <p className="text-xs text-zinc-500 mt-1.5 flex items-center gap-1">
                <span className="text-emerald-400 font-medium">+10 points</span>{" "}
                awarded per referral
              </p>
            </div>
          </div>

          {/* Card 2: Referral Code */}
          <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Your Referral Code
              </span>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                <Gift className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-mono font-bold text-indigo-300 tracking-wider bg-indigo-950/40 border border-indigo-500/30 px-3.5 py-2 rounded-xl text-center">
                {dashboardData?.referralCode}
              </div>
              <p className="text-xs text-zinc-500 mt-2 text-center">
                Give code to friends at signup
              </p>
            </div>
          </div>

          {/* Card 3: Total Referees */}
          <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Total Referees
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-4xl font-extrabold text-white tracking-tight">
                {dashboardData?.referees.length ?? 0}
              </div>
              <p className="text-xs text-zinc-500 mt-1.5">
                Users joined with your link
              </p>
            </div>
          </div>
        </div>

        {/* Shareable Link Box */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-indigo-400" /> Shareable
            Referral Link
          </h2>
          <p className="text-xs text-zinc-400 mb-4">
            Copy and share this direct link with your network to automatically
            apply your referral code during signup.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              type="text"
              readOnly
              value={referralLink}
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-zinc-300 font-mono focus:outline-none select-all"
            />
            <button
              onClick={handleCopyLink}
              className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                copied
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" /> Link Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Copy Link
                </>
              )}
            </button>
          </div>
        </div>

        {/* Referees Table Section */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-400" /> Your Referred
                Users
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Users who signed up using your referral code
              </p>
            </div>
            <span className="bg-zinc-800 border border-zinc-700/60 text-zinc-300 text-xs font-semibold px-2.5 py-1 rounded-full">
              {dashboardData?.referees.length || 0} Total
            </span>
          </div>

          {!dashboardData?.referees || dashboardData.referees.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/40">
              <div className="w-12 h-12 rounded-full bg-zinc-800/80 text-zinc-400 flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-white">
                No referrals yet
              </h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                Share your referral link with friends to get your first 10
                points reward!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Joined Date</th>
                    <th className="py-3 px-4 text-right">Points Earned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50 text-zinc-300">
                  {dashboardData.referees.map((referee) => (
                    <tr
                      key={referee.id}
                      className="hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-medium text-white flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-indigo-900/50 text-indigo-300 border border-indigo-500/20 flex items-center justify-center text-xs font-bold shrink-0">
                          {referee.name?.[0]?.toUpperCase() || "U"}
                        </div>
                        <span>{referee.name}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-zinc-400">
                        {referee.email}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-400">
                        {new Date(referee.createdAt).toLocaleDateString(
                          undefined,
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="inline-flex items-center gap-1 bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-semibold px-2 py-0.5 rounded-full text-[11px]">
                          +10 pts
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
