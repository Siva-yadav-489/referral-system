"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
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

import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";

import Logo from "./Logo";

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  general?: string;
}

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setErrors({});

    if (!validateDetails()) {
      return;
    }

    setLoading(true);

    try {
      const res = await authClient.signUp.email({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      if (res.error) {
        setErrors({
          general:
            res.error.message || "Failed to create account. Please try again.",
        });

        return;
      }

      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";

      setErrors({
        general: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border-border shadow-lg">
        <CardHeader>
          <Logo />

          <CardTitle className="mt-5">Create an account</CardTitle>

          <CardDescription>
            Enter your information below to create your account
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} noValidate>
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
                      setErrors((prev) => ({
                        ...prev,
                        name: undefined,
                      }));
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
                      setErrors((prev) => ({
                        ...prev,
                        email: undefined,
                      }));
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

                {errors.password && <FieldError>{errors.password}</FieldError>}
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
                  ) : (
                    <>
                      <span>Create Account</span>
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
      </Card>
    </div>
  );
}
