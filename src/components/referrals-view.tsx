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
  RefreshCw,
  Clock,
  Coins,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ReferralsView() {
  const { data: session, isPending: sessionLoading } = useSession();
  const router = useRouter();

  const [dashboardData, setDashboardData] =
    useState<ReferralDashboardData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (sessionLoading) return;
    if (!session?.user) {
      router.push("/login");
      return;
    }

    let ignore = false;
    getReferralDashboardData()
      .then((data) => {
        if (!ignore) {
          setDashboardData(data);
          setError(null);
          setDataLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          console.error("Error fetching dashboard data:", err);
          const message =
            err instanceof Error
              ? err.message
              : "Failed to load referral dashboard data.";
          setError(message);
          setDataLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [session, sessionLoading, router, reloadToken]);

  const handleRetry = () => {
    setDataLoading(true);
    setError(null);
    setReloadToken((prev) => prev + 1);
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const referralLink = dashboardData
    ? `${origin}/referral/${dashboardData.referralCode}`
    : "";

  const handleCopyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
  };

  const handleCopyCode = () => {
    if (!dashboardData?.referralCode) return;
    navigator.clipboard.writeText(dashboardData.referralCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2500);
  };

  const referees = dashboardData?.referees || [];
  const history = dashboardData?.history || [];

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-10 w-full p-2 md:p-10">
      {/* Top Row: Informational Banner */}
      <div className="flex flex-col items-center space-y-5 pb-10">
        <div className="text-center space-y-5">
          <div className="text-xl md:text-3xl font-bold tracking-tight">
            Earn Rewards with Friends
          </div>
          <div className="text-sm font-semibold text-neutral-600/85 dark:text-neutral-400">
            Share your referral link with friends. <br /> Earn{" "}
            <span className="font-bold text-emerald-600">+10 pts</span> when
            they sign up and{" "}
            <span className="font-bold text-emerald-600">+25 pts</span> on their
            first purchase.
          </div>
        </div>
        {dashboardData?.referredBy && (
          <p className="flex items-center gap-2 text-xs text-foreground font-semibold bg-teal-500 rounded-md px-3 py-2 shadow-xs border w-fit">
            <Gift className="size-3.5 shrink-0" />
            <span>
              You were referred by{" "}
              <span className="font-bold">{dashboardData.referredBy.name}</span>
              {dashboardData.referredBy.email ? (
                <span> ({dashboardData.referredBy.email})</span>
              ) : null}
              .
            </span>
          </p>
        )}
      </div>

      {dataLoading && !dashboardData ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent mb-3" />
          <p className="text-sm text-muted-foreground">
            Loading referral data...
          </p>
        </div>
      ) : error ? (
        <Card className="border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive mb-4">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            className="gap-2 mx-auto"
          >
            <RefreshCw className="size-3.5" /> Try Again
          </Button>
        </Card>
      ) : (
        <>
          <Card className="shadow-xs flex flex-col justify-between">
            <CardHeader className="text-lg font-bold">
              Invite friends
            </CardHeader>
            <CardContent className="space-y-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-sm font-semibold">Referral Link:</p>
                <div className="flex items-center gap-1.5 min-w-0 bg-gray-200 dark:bg-gray-400 p-2 rounded-md">
                  <input
                    type="text"
                    readOnly
                    value={referralLink}
                    className="min-w-0 flex-1 bg-transparent text-xs font-mono font-medium text-neutral-500 dark:text-neutral-200 outline-none select-all truncate"
                    title={referralLink}
                  />

                  <Button
                    size="icon-xs"
                    variant={linkCopied ? "default" : "ghost"}
                    onClick={handleCopyLink}
                    title={linkCopied ? "Copied!" : "Copy link"}
                    className="shrink-0 rounded-lg size-8 cursor-pointer"
                  >
                    {linkCopied ? (
                      <Check className="size-4" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Referral Code:</p>
                <div className="flex items-center gap-1.5 min-w-0 dark:bg-gray-400 bg-gray-200 p-2 rounded-md">
                  <input
                    type="text"
                    readOnly
                    value={dashboardData?.referralCode}
                    className="min-w-0 flex-1 bg-transparent text-sm font-mono font-medium text-neutral-500 dark:text-neutral-200 outline-none select-all truncate"
                    title={dashboardData?.referralCode}
                  />

                  <Button
                    size="icon-xs"
                    variant={codeCopied ? "default" : "ghost"}
                    onClick={handleCopyCode}
                    title={codeCopied ? "Copied!" : "Copy code"}
                    className="shrink-0 rounded-lg size-8 cursor-pointer"
                  >
                    {codeCopied ? (
                      <Check className="size-4" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* <p className="text-[11px] ml-1 font-semibold text-muted-foreground">
                {copied ? "Copied to clipboard!" : "Click icon to copy"}
              </p> */}
            </CardContent>
          </Card>
          {/* 1st Row: 4 Metric Columns */}
          {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"> */}
          {/* Column 1: Total Points */}
          {/* <Card className="border-border shadow-xs flex flex-col justify-between">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Total Points
                  </span>
                  <Coins className="size-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl md:text-3xl font-bold tracking-tight">
                  {dashboardData?.points || 0}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    PTS
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Available reward balance
                </p>
              </CardContent>
            </Card> */}

          {/* Column 2: Referral Code */}
          {/* <Card className="border-border shadow-xs flex flex-col justify-between">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Referral Code
                  </span>
                  <Gift className="size-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="font-mono text-xl font-bold tracking-wider">
                  {dashboardData?.referralCode || "—"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Your unique code
                </p>
              </CardContent>
            </Card> */}

          {/* Column 3: Total Referees */}
          {/* <Card className="border-border shadow-xs flex flex-col justify-between">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Total Referees
                  </span>
                  <Users className="size-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl md:text-3xl font-bold tracking-tight">
                  {referees.length}
                </div>
                <p className="text-xs text-muted-foreground">Friends invited</p>
              </CardContent>
            </Card> */}

          {/* Column 4: Copyable Link with Single Click Copy */}
          {/* <Card className="border-border shadow-xs flex flex-col justify-between">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Invite Link
                  </span>
                  <LinkIcon className="size-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <input
                    type="text"
                    readOnly
                    value={referralLink}
                    className="min-w-0 flex-1 bg-transparent text-xs font-mono text-muted-foreground outline-none select-all truncate"
                    title={referralLink}
                  />

                  <Button
                    size="icon-xs"
                    variant={copied ? "default" : "ghost"}
                    onClick={handleCopyLink}
                    title={copied ? "Copied!" : "Copy link"}
                    className="shrink-0 rounded-md"
                  >
                    {copied ? (
                      <Check className="size-3.5" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </Button>
                </div>

                <p className="text-[11px] text-muted-foreground">
                  {copied ? "Copied to clipboard!" : "Click icon to copy"}
                </p>
              </CardContent>
            </Card> */}
          {/* </div> */}

          {/* 2nd Row: 2 Columns [Referee Details | Point History] */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Column 1: Referee Details List */}
            <Card className="border-border shadow-xs">
              <CardHeader className="">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold">
                    Referee Details
                  </CardTitle>
                  <p className="text-xs font-semibold rounded-sm text-foreground dark:text-background shadow-xs border-border py-1 px-3 bg-gray-200">
                    Total:&nbsp;{referees.length}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {referees.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center font-semibold text-muted-foreground">
                    <Users className="size-8 opacity-40 mb-2" />
                    <p className="text-sm text-foreground">No referees yet</p>
                    <p className="text-xs mt-0.5">
                      Share your code or link above to start earning points.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {referees.map((referee) => {
                      const dateStr = referee.createdAt
                        ? new Date(referee.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )
                        : "—";

                      const hasPurchase =
                        referee.milestonesCompleted.includes("PURCHASE");
                      const hasSignup =
                        referee.milestonesCompleted.includes("SIGNUP");

                      return (
                        <div
                          key={referee.id}
                          className="flex items-center justify-between py-3 gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                              {referee.name?.[0]?.toUpperCase() || "U"}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate leading-tight">
                                {referee.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {referee.email} • {dateStr}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 font-semibold">
                            {hasPurchase ? (
                              <span
                                // variant="outline"
                                className="gap-1 text-[12px] border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5"
                              >
                                {/* <CheckCircle2 className="size-3" /> */}
                                Purchased (+25)
                              </span>
                            ) : hasSignup ? (
                              <span
                                // variant="outline"
                                className="gap-1 text-[12px]"
                              >
                                {/* <Check className="size-3" /> */}
                                Joined (+10)
                              </span>
                            ) : (
                              <span
                                // variant="outline"
                                className="gap-1 text-[12px] text-muted-foreground"
                              >
                                <Clock className="size-3" />
                                Pending
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Column 2: Point History (Transactions) */}
            <Card className="border-border shadow-xs">
              <CardHeader className="">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold">
                    Point History
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold rounded-sm shadow-xs text-foreground dark:text-background border-border py-1 px-3 bg-gray-200">
                      Points:&nbsp;{dashboardData?.points}
                    </p>
                    <p className="text-xs font-semibold rounded-sm shadow-xs text-foreground dark:text-background border-border py-1 px-3 bg-gray-200">
                      Transactions:&nbsp;{history.length}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center font-semibold text-muted-foreground">
                    <Coins className="size-8 opacity-40 mb-2" />
                    <p className="text-sm text-foreground">
                      No transactions yet
                    </p>
                    <p className="text-xs mt-0.5">
                      Point rewards will show up here as your friends join.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {history.map((tx) => {
                      const isPositive = tx.points > 0;
                      const dateStr = tx.rewardedAt
                        ? new Date(tx.rewardedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—";

                      return (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between py-3 gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs">
                              {tx.milestone === "PURCHASE" ? (
                                <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Sparkles className="size-4 text-muted-foreground" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate leading-tight">
                                {tx.reason}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {dateStr}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`text-sm font-semibold shrink-0 font-mono ${
                              isPositive
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-destructive"
                            }`}
                          >
                            {isPositive ? `+${tx.points}` : tx.points} PTS
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
