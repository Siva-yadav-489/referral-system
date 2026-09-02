"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  validateReferralCode,
  setReferralCookie,
} from "@/app/actions/referral";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Gift,
  Home,
} from "lucide-react";

interface ReferralPageProps {
  params: Promise<{ referralId: string }>;
}

export default function ReferralValidationPage({ params }: ReferralPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const rawCode = resolvedParams?.referralId || "";
  const referralCode = decodeURIComponent(rawCode).trim().toUpperCase();

  const [status, setStatus] = useState<"validating" | "valid" | "invalid">(
    () => (!referralCode ? "invalid" : "validating"),
  );
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!referralCode) return;

    let isMounted = true;

    async function checkCode() {
      try {
        const isValid = await validateReferralCode(referralCode);
        if (!isMounted) return;

        if (isValid) {
          await setReferralCookie(referralCode);
          setStatus("valid");
        } else {
          setStatus("invalid");
        }
      } catch {
        if (isMounted) setStatus("invalid");
      }
    }

    checkCode();

    return () => {
      isMounted = false;
    };
  }, [referralCode]);

  // Auto redirect countdown on valid code
  useEffect(() => {
    if (status !== "valid") return;

    if (countdown <= 0) {
      router.push(`/signup?ref=${encodeURIComponent(referralCode)}`);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [status, countdown, referralCode, router]);

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-background text-foreground">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border-border">
          {status === "validating" && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted border border-border">
                  <Loader2 className="size-6 animate-spin text-foreground" />
                </div>
                <CardTitle className="text-xl">
                  Validating Referral Link
                </CardTitle>
                <CardDescription>
                  Please wait while we verify your invitation...
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center pb-8 pt-4">
                <div className="text-xs text-muted-foreground font-mono bg-muted px-3 py-1.5 rounded-md border border-border">
                  Checking: {referralCode || "..."}
                </div>
              </CardContent>
            </>
          )}

          {status === "valid" && (
            <>
              <CardHeader className="text-center pb-3">
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-muted border border-border">
                  <Gift className="size-7 text-foreground" />
                </div>
                <div className="flex justify-center mb-1">
                  <Badge variant="default" className="gap-1 px-3 py-1">
                    <CheckCircle2 className="size-3.5" />
                    Valid Invitation
                  </Badge>
                </div>
                <CardTitle className="text-2xl font-semibold tracking-tight">
                  You&apos;ve Been Invited!
                </CardTitle>
                <CardDescription className="text-sm">
                  Your referral link has been verified. Sign up now to claim your welcome bonus points.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-3.5">
                  <span className="text-xs font-medium text-muted-foreground">
                    Referral Code
                  </span>
                  <span className="font-mono text-sm font-semibold tracking-wider text-foreground">
                    {referralCode}
                  </span>
                </div>

                <div className="space-y-2 pt-2">
                  <Link
                    href={`/signup?ref=${encodeURIComponent(referralCode)}`}
                    className={cn(
                      buttonVariants({ variant: "default", size: "lg" }),
                      "w-full gap-2 font-medium",
                    )}
                  >
                    <span>Continue to Sign Up</span>
                    <ArrowRight className="size-4" />
                  </Link>
                  <p className="text-center text-xs text-muted-foreground">
                    Redirecting automatically in {countdown}s...
                  </p>
                </div>
              </CardContent>
            </>
          )}

          {status === "invalid" && (
            <>
              <CardHeader className="text-center pb-3">
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-destructive/10 border border-destructive/30 text-destructive">
                  <AlertCircle className="size-7" />
                </div>
                <div className="flex justify-center mb-1">
                  <Badge variant="destructive" className="px-3 py-1">
                    Invalid Link
                  </Badge>
                </div>
                <CardTitle className="text-2xl font-semibold tracking-tight">
                  Invalid Referral Link
                </CardTitle>
                <CardDescription className="text-sm">
                  The referral code{" "}
                  {referralCode && (
                    <span className="font-mono font-medium text-foreground">
                      &quot;{referralCode}&quot;
                    </span>
                  )}{" "}
                  does not exist or is no longer active. You can still create an account manually.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                <Link
                  href="/signup"
                  className={cn(
                    buttonVariants({ variant: "default", size: "lg" }),
                    "w-full gap-2 font-medium",
                  )}
                >
                  <span>Sign Up Manually</span>
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "default" }),
                    "w-full gap-2",
                  )}
                >
                  <Home className="size-4" />
                  <span>Back to Home</span>
                </Link>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
