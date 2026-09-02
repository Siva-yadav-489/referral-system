"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import {
  validateReferralCode,
  setReferralCookie,
} from "@/app/actions/referral";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Gift,
  Loader2,
} from "lucide-react";

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  refCode?: string;
  general?: string;
}

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initial referral code from URL query (?ref=... or ?referral=...)
  const initialRefCode = (
    searchParams.get("ref") ||
    searchParams.get("referral") ||
    ""
  )
    .trim()
    .toUpperCase();

  // Step state: for direct signup -> "details" | "referral"
  const [step, setStep] = useState<"details" | "referral">("details");

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [refCode, setRefCode] = useState(initialRefCode);
  const hasInitialRef = !!initialRefCode;

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Client-side details validation
  const validateDetails = (): boolean => {
    const nextErrors: FormErrors = {};

    const trimmedName = name.trim();
    if (!trimmedName) {
      nextErrors.name = "Full name is required.";
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      nextErrors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (!password) {
      nextErrors.password = "Password is required.";
    } else if (password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  // Perform actual signup API call
  const performSignUp = async (referralToUse?: string) => {
    setLoading(true);
    setErrors({});

    try {
      const cleanRef = referralToUse?.trim().toUpperCase();

      if (cleanRef) {
        await setReferralCookie(cleanRef);
      }

      const signupData = {
        name: name.trim(),
        email: email.trim(),
        password,
        ...(cleanRef ? { ref: cleanRef } : {}),
      };

      const res = await authClient.signUp.email(
        signupData as Parameters<typeof authClient.signUp.email>[0],
      );

      if (res.error) {
        setErrors({
          general:
            res.error.message || "Failed to create account. Please try again.",
        });
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrors({ general: message });
    } finally {
      setLoading(false);
    }
  };

  // Handler for Step 1 submission
  const handleDetailsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    if (!validateDetails()) {
      return;
    }

    // If user arrived with a referral link, directly sign up without the prompt step
    if (hasInitialRef && refCode) {
      await performSignUp(refCode);
    } else {
      // Direct signup flow -> go to optional referral step
      setStep("referral");
    }
  };

  // Handler for Step 2: submitting with optional referral code
  const handleReferralSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const trimmedCode = refCode.trim().toUpperCase();
    if (!trimmedCode) {
      // No code entered, just proceed with regular signup
      await performSignUp();
      return;
    }

    setLoading(true);

    try {
      const isValid = await validateReferralCode(trimmedCode);
      if (!isValid) {
        setErrors({
          refCode:
            "Invalid referral code. Please enter a valid code or click skip.",
        });
        setLoading(false);
        return;
      }

      await performSignUp(trimmedCode);
    } catch {
      setErrors({
        refCode: "Could not verify referral code. You can skip to continue.",
      });
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border-border shadow-lg">
        {step === "details" ? (
          <>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Create an account</CardTitle>
                {hasInitialRef && (
                  <Badge
                    variant="default"
                    className="gap-1 text-[11px] font-medium"
                  >
                    <Gift className="size-3" />
                    Referral Applied
                  </Badge>
                )}
              </div>
              <CardDescription>
                {hasInitialRef ? (
                  <p>
                    Signing up with invitation code{" "}
                    <span className="font-mono font-semibold text-foreground">
                      {refCode}
                    </span>
                  </p>
                ) : (
                  "Enter your information below to create your account"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDetailsSubmit} noValidate>
                <FieldGroup>
                  {errors.general && (
                    <div
                      role="alert"
                      className="flex items-start gap-2.5 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
                    >
                      <AlertCircle className="size-4 shrink-0 translate-y-0.5" />
                      <span>{errors.general}</span>
                    </div>
                  )}

                  <Field data-invalid={!!errors.name}>
                    <FieldLabel htmlFor="name">Full Name</FieldLabel>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Jane Doe"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name) {
                          setErrors((prev) => ({ ...prev, name: undefined }));
                        }
                      }}
                      aria-invalid={!!errors.name}
                      disabled={loading}
                      autoComplete="name"
                      required
                    />
                    {errors.name && <FieldError>{errors.name}</FieldError>}
                  </Field>

                  <Field data-invalid={!!errors.email}>
                    <FieldLabel htmlFor="email">Email Address</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      placeholder="jane@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) {
                          setErrors((prev) => ({ ...prev, email: undefined }));
                        }
                      }}
                      aria-invalid={!!errors.email}
                      disabled={loading}
                      autoComplete="email"
                      required
                    />
                    {errors.email && <FieldError>{errors.email}</FieldError>}
                  </Field>

                  <Field data-invalid={!!errors.password}>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="At least 8 characters"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errors.password) {
                            setErrors((prev) => ({
                              ...prev,
                              password: undefined,
                            }));
                          }
                        }}
                        aria-invalid={!!errors.password}
                        disabled={loading}
                        autoComplete="new-password"
                        className="pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <FieldError>{errors.password}</FieldError>
                    )}
                  </Field>

                  <Field>
                    <Button
                      type="submit"
                      className="w-full gap-2 font-medium"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          <span>Creating account...</span>
                        </>
                      ) : hasInitialRef ? (
                        <>
                          <span>Create Account & Claim Bonus</span>
                          <ArrowRight className="size-4" />
                        </>
                      ) : (
                        <>
                          <span>Continue</span>
                          <ArrowRight className="size-4" />
                        </>
                      )}
                    </Button>
                    <FieldDescription className="text-center">
                      Already have an account?{" "}
                      <Link
                        href="/login"
                        className="underline underline-offset-4 hover:text-primary"
                      >
                        Sign in
                      </Link>
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
          </>
        ) : (
          /* Step 2: Optional Referral Code Step for Direct Signups */
          <>
            <CardHeader>
              <div className="flex items-center gap-2 mb-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setStep("details")}
                  disabled={loading}
                  className="rounded-full"
                >
                  <ArrowLeft className="size-4" />
                </Button>
                <CardTitle className="text-xl">Have a referral code?</CardTitle>
              </div>
              <CardDescription>
                Enter a referral code to earn welcome bonus points, or skip to
                finish creating your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleReferralSubmit} noValidate>
                <FieldGroup>
                  {errors.general && (
                    <div
                      role="alert"
                      className="flex items-start gap-2.5 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
                    >
                      <AlertCircle className="size-4 shrink-0 translate-y-0.5" />
                      <span>{errors.general}</span>
                    </div>
                  )}

                  <Field data-invalid={!!errors.refCode}>
                    <FieldLabel htmlFor="refCode">
                      Referral Code (Optional)
                    </FieldLabel>
                    <Input
                      id="refCode"
                      type="text"
                      placeholder="e.g. REF12345"
                      value={refCode}
                      onChange={(e) => {
                        setRefCode(e.target.value.toUpperCase());
                        if (errors.refCode) {
                          setErrors((prev) => ({
                            ...prev,
                            refCode: undefined,
                          }));
                        }
                      }}
                      aria-invalid={!!errors.refCode}
                      disabled={loading}
                      autoCapitalize="characters"
                      className="font-mono uppercase tracking-wider"
                    />
                    {errors.refCode ? (
                      <FieldError>{errors.refCode}</FieldError>
                    ) : (
                      <FieldDescription>
                        Optional: Leave empty if you don&apos;t have one.
                      </FieldDescription>
                    )}
                  </Field>

                  <Field className="space-y-2 pt-2">
                    <Button
                      type="submit"
                      className="w-full gap-2 font-medium"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          <span>Creating account...</span>
                        </>
                      ) : (
                        <>
                          <span>
                            {refCode.trim()
                              ? "Apply Code & Complete Sign Up"
                              : "Complete Sign Up"}
                          </span>
                          <CheckCircle2 className="size-4" />
                        </>
                      )}
                    </Button>
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
