"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Eye,
  EyeOff,
  Loader,
  TriangleAlert,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";

import { useForgotPassword } from "../hooks/use-forgot-password";
import { useResetPassword } from "../hooks/use-reset-password";

export const ForgotPasswordCard = () => {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token");
  const emailFromUrl = searchParams.get("email");

  // Determine which phase we're in based on URL params
  const isResetPhase = !!(tokenFromUrl && emailFromUrl);

  if (isResetPhase) {
    return (
      <ResetPasswordPhase
        token={tokenFromUrl!}
        email={emailFromUrl!}
      />
    );
  }

  return <RequestResetPhase />;
};

// --- Phase 1: Request a reset link ---

const RequestResetPhase = () => {
  const mutation = useForgotPassword();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    mutation.mutate(
      { email },
      {
        onSuccess: () => {
          setSubmitted(true);
        },
      },
    );
  };

  if (submitted) {
    return (
      <Card className="w-full h-full p-8">
        <CardHeader className="px-0 pt-0">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="size-5 text-emerald-500" />
            <CardTitle>Check your email</CardTitle>
          </div>
          <CardDescription>
            If an account with that email exists, we&apos;ve sent a password
            reset link. Check your inbox and spam folder.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-0 pb-0">
          <p className="text-muted-foreground text-xs">
            The link will expire in 15 minutes.
          </p>
          <Link href="/sign-in">
            <Button variant="outline" className="w-full mt-2">
              <ArrowLeft className="size-4 mr-2" />
              Back to Sign In
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full p-8">
      <CardHeader className="px-0 pt-0">
        <CardTitle>Forgot your password?</CardTitle>
        <CardDescription>
          Enter your email address and we&apos;ll send you a link to reset your
          password.
        </CardDescription>
      </CardHeader>
      {!!mutation.error && (
        <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-x-2 text-sm text-destructive mb-4">
          <TriangleAlert className="size-4" />
          <p>{mutation.error.message || "Something went wrong"}</p>
        </div>
      )}
      <CardContent className="space-y-5 px-0 pb-0">
        <form onSubmit={onSubmit} className="space-y-2.5">
          <Input
            disabled={mutation.isPending}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            autoComplete="email"
            autoFocus
            required
          />
          <Button
            disabled={mutation.isPending}
            type="submit"
            className="w-full"
            size="lg"
          >
            {mutation.isPending && (
              <Loader className="size-4 animate-spin mr-2" />
            )}
            Send Reset Link
          </Button>
        </form>
        <p className="text-muted-foreground text-xs">
          Remember your password?{" "}
          <Link href="/sign-in">
            <span className="text-sky-700 hover:underline">Sign in</span>
          </Link>
        </p>
      </CardContent>
    </Card>
  );
};

// --- Phase 2: Reset password with token ---

interface ResetPasswordPhaseProps {
  token: string;
  email: string;
}

const ResetPasswordPhase = ({ token, email }: ResetPasswordPhaseProps) => {
  const mutation = useResetPassword();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);

  const passwordsMatch =
    confirmPassword.length === 0 || newPassword === confirmPassword;
  const isNewPasswordLongEnough = newPassword.length >= 3;
  const isNewPasswordShortEnough = newPassword.length <= 20;
  const isFormValid =
    isNewPasswordLongEnough &&
    isNewPasswordShortEnough &&
    confirmPassword.length > 0 &&
    passwordsMatch;

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isFormValid) return;

    mutation.mutate(
      { email, token, newPassword, confirmPassword },
      {
        onSuccess: () => {
          setResetComplete(true);
        },
      },
    );
  };

  if (resetComplete) {
    return (
      <Card className="w-full h-full p-8">
        <CardHeader className="px-0 pt-0">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="size-5 text-emerald-500" />
            <CardTitle>Password reset successful</CardTitle>
          </div>
          <CardDescription>
            Your password has been updated. You can now sign in with your new
            password.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Link href="/sign-in">
            <Button className="w-full" size="lg">
              Sign In
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full p-8">
      <CardHeader className="px-0 pt-0">
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>Choose a new password for your account.</CardDescription>
      </CardHeader>
      {!!mutation.error && (
        <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-x-2 text-sm text-destructive mb-4">
          <TriangleAlert className="size-4" />
          <p>{mutation.error.message || "Something went wrong"}</p>
        </div>
      )}
      <CardContent className="space-y-5 px-0 pb-0">
        <form onSubmit={onSubmit} className="space-y-2.5">
          {/* New Password */}
          <div className="relative">
            <Input
              disabled={mutation.isPending}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              type={showNew ? "text" : "password"}
              autoComplete="new-password"
              autoFocus
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowNew(!showNew)}
              tabIndex={-1}
            >
              {showNew ? (
                <EyeOff className="size-4 text-muted-foreground" />
              ) : (
                <Eye className="size-4 text-muted-foreground" />
              )}
            </Button>
          </div>
          {newPassword.length > 0 && !isNewPasswordLongEnough && (
            <p className="text-xs text-destructive">
              Password must be at least 3 characters
            </p>
          )}
          {newPassword.length > 20 && (
            <p className="text-xs text-destructive">
              Password must be at most 20 characters
            </p>
          )}

          {/* Confirm Password */}
          <div className="relative">
            <Input
              disabled={mutation.isPending}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowConfirm(!showConfirm)}
              tabIndex={-1}
            >
              {showConfirm ? (
                <EyeOff className="size-4 text-muted-foreground" />
              ) : (
                <Eye className="size-4 text-muted-foreground" />
              )}
            </Button>
          </div>
          {!passwordsMatch && (
            <p className="text-xs text-destructive">Passwords do not match</p>
          )}

          <Button
            disabled={mutation.isPending || !isFormValid}
            type="submit"
            className="w-full"
            size="lg"
          >
            {mutation.isPending && (
              <Loader className="size-4 animate-spin mr-2" />
            )}
            Reset Password
          </Button>
        </form>
        <p className="text-muted-foreground text-xs">
          <Link href="/forgot-password">
            <span className="text-sky-700 hover:underline">
              Request a new reset link
            </span>
          </Link>
        </p>
      </CardContent>
    </Card>
  );
};
