"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader,
  CheckCircle2,
  TriangleAlert,
  ArrowLeft,
} from "lucide-react";

import { useVerifyEmail } from "../hooks/use-verify-email";

export const VerifyEmailCard = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const mutation = useVerifyEmail();
  const hasAttempted = useRef(false);
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );

  useEffect(() => {
    if (!token || !email || hasAttempted.current) return;

    hasAttempted.current = true;

    mutation.mutate(
      { email, token },
      {
        onSuccess: () => setStatus("success"),
        onError: () => setStatus("error"),
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, email]);

  if (!token || !email) {
    return (
      <Card className="w-full h-full p-8">
        <CardHeader className="px-0 pt-0">
          <div className="flex items-center gap-2 mb-2">
            <TriangleAlert className="size-5 text-destructive" />
            <CardTitle>Invalid Link</CardTitle>
          </div>
          <CardDescription>
            This verification link is missing required information. Please check
            your email for the correct link.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Link href="/sign-in">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="size-4 mr-2" />
              Back to Sign In
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (status === "loading") {
    return (
      <Card className="w-full h-full p-8">
        <CardHeader className="px-0 pt-0">
          <CardTitle>Verifying your email...</CardTitle>
          <CardDescription>
            Please wait while we verify your email address.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8 px-0 pb-0">
          <Loader className="size-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (status === "success") {
    return (
      <Card className="w-full h-full p-8">
        <CardHeader className="px-0 pt-0">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="size-5 text-emerald-500" />
            <CardTitle>Email verified!</CardTitle>
          </div>
          <CardDescription>
            Your email has been successfully verified. You can now access all
            features of your account.
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

  // Error state
  return (
    <Card className="w-full h-full p-8">
      <CardHeader className="px-0 pt-0">
        <div className="flex items-center gap-2 mb-2">
          <TriangleAlert className="size-5 text-destructive" />
          <CardTitle>Verification failed</CardTitle>
        </div>
        <CardDescription>
          {mutation.error?.message ||
            "This verification link is invalid or has expired."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 px-0 pb-0">
        <Link href="/sign-in">
          <Button variant="outline" className="w-full">
            <ArrowLeft className="size-4 mr-2" />
            Back to Sign In
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};
