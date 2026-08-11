"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { validateReferralCode } from "@/app/actions/referral";
import Link from "next/link";
import {
  Gift,
  User,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

function SignupFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [refCode, setRefCode] = useState("");
  const [refCodeError, setRefCodeError] = useState<string | null>(null);
  const [refCodeSuccess, setRefCodeSuccess] = useState<boolean>(false);
  const [isValidatingRef, setIsValidatingRef] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("ref") || searchParams.get("referral");
    if (code) {
      const cleanCode = code.trim().toUpperCase();
      setIsValidatingRef(true);
      validateReferralCode(cleanCode)
        .then((isValid) => {
          setIsValidatingRef(false);
          if (isValid) {
            setRefCode(cleanCode);
            setRefCodeSuccess(true);
          } else {
            // Invalid referral code in URL -> Redirect to home with error parameter
            router.push("/?error=invalid_referral");
          }
        })
        .catch(() => {
          setIsValidatingRef(false);
          router.push("/?error=invalid_referral");
        });
    }
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setRefCodeError(null);
    setLoading(true);

    try {
      // Validate optional referral code input before submitting signup
      if (refCode.trim()) {
        const cleanRef = refCode.trim().toUpperCase();
        const isValid = await validateReferralCode(cleanRef);
        if (!isValid) {
          setRefCodeError(
            "Invalid referral code. Please enter a valid code or leave it blank.",
          );
          setLoading(false);
          return;
        }
      }

      const res = await authClient.signUp.email({
        email,
        password,
        name,
        // Pass ref code into signup body for database hook to handle atomically
        ...(refCode ? { ref: refCode.trim().toUpperCase() } : {}),
      } as any);

      if (res.error) {
        setError(
          res.error.message || "Failed to create account. Please try again.",
        );
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (isValidatingRef) {
    return (
      <div className="w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-2xl p-8 shadow-2xl backdrop-blur-xl text-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-zinc-300 font-medium">
          Validating referral link...
        </p>
        <p className="text-xs text-zinc-500 mt-1">Please wait a moment</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 mb-4">
          <Gift className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Create your account
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Join today and earn referral rewards
        </p>
      </div>

      {/* Commented out as requested: do not display ref code badge based on URL alone
      {refCode && (
        <div className="mb-6 p-3.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <span className="text-emerald-300 font-semibold">
              Referral Applied:{" "}
            </span>
            <code className="bg-emerald-900/50 px-1.5 py-0.5 rounded text-emerald-200 font-mono font-bold">
              {refCode}
            </code>
            <p className="text-emerald-400/80 mt-0.5">
              You and your referrer will receive 10 bonus points!
            </p>
          </div>
        </div>
      )}
      */}

      {error && (
        <div className="mb-6 p-3.5 bg-red-950/50 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-300 text-sm">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-medium text-zinc-400">
              Referral Code (Optional)
            </label>
            {refCodeSuccess && (
              <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Valid code (+10 pts)
              </span>
            )}
          </div>
          <input
            type="text"
            value={refCode}
            onChange={(e) => {
              const val = e.target.value.toUpperCase();
              setRefCode(val);
              setRefCodeError(null);
              setRefCodeSuccess(false);
            }}
            onBlur={async () => {
              if (!refCode.trim()) {
                setRefCodeError(null);
                setRefCodeSuccess(false);
                return;
              }
              const isValid = await validateReferralCode(refCode.trim());
              if (isValid) {
                setRefCodeSuccess(true);
                setRefCodeError(null);
              } else {
                setRefCodeSuccess(false);
                setRefCodeError(
                  "Invalid referral code. Please enter a valid code or leave it blank.",
                );
              }
            }}
            placeholder="e.g. REF12345"
            className={`w-full bg-zinc-950 border rounded-xl px-4 py-2.5 text-sm text-white font-mono placeholder-zinc-600 focus:outline-none transition-all ${
              refCodeError
                ? "border-red-500/80 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                : refCodeSuccess
                ? "border-emerald-500/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                : "border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            }`}
          />
          {refCodeError && (
            <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {refCodeError}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 cursor-pointer"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Create Account
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-zinc-400">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-indigo-400 hover:underline font-medium"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="text-white text-sm">Loading signup page...</div>
        }
      >
        <SignupFormContent />
      </Suspense>
    </div>
  );
}
