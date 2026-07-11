"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";

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
  Trash2,
} from "lucide-react";

import { useConfirmDeleteAccount } from "../hooks/use-confirm-delete-account";

export const DeleteAccountCard = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const mutation = useConfirmDeleteAccount();
  const [status, setStatus] = useState<"pending" | "loading" | "success" | "error">(
    "pending",
  );

  const handleConfirm = () => {
    if (!token || !email) return;

    setStatus("loading");
    mutation.mutate(
      { email, token },
      {
        onSuccess: () => {
          setStatus("success");
          // Clear session and redirect after a brief delay
          setTimeout(() => {
            signOut({ callbackUrl: "/" });
          }, 3000);
        },
        onError: () => setStatus("error"),
      },
    );
  };

  if (!token || !email) {
    return (
      <Card className="w-full h-full p-8">
        <CardHeader className="px-0 pt-0">
          <div className="flex items-center gap-2 mb-2">
            <TriangleAlert className="size-5 text-destructive" />
            <CardTitle>Invalid Link</CardTitle>
          </div>
          <CardDescription>
            This deletion link is missing required information. Please check your
            email for the correct link.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Link href="/">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="size-4 mr-2" />
              Return Home
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (status === "pending") {
    return (
      <Card className="w-full h-full p-8 border-destructive/50">
        <CardHeader className="px-0 pt-0">
          <div className="flex items-center gap-2 mb-2 text-destructive">
            <Trash2 className="size-5" />
            <CardTitle>Delete Account</CardTitle>
          </div>
          <CardDescription className="text-foreground font-medium mt-2">
            Are you absolutely sure you want to delete your account?
          </CardDescription>
          <CardDescription className="mt-2 text-muted-foreground">
            This action is permanent and irreversible. All of your data, including
            projects and templates, will be permanently removed from our servers.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 px-0 pb-0 mt-6">
          <Button
            onClick={handleConfirm}
            variant="destructive"
            className="w-full"
            size="lg"
          >
            Yes, Delete My Account
          </Button>
          <Link href="/">
            <Button variant="outline" className="w-full" size="lg">
              Cancel
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
          <CardTitle>Deleting your account...</CardTitle>
          <CardDescription>
            Please wait while we process your request and remove your data.
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
            <CardTitle>Account Deleted</CardTitle>
          </div>
          <CardDescription>
            Your account and all associated data have been permanently deleted.
            You will be redirected shortly...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8 px-0 pb-0">
          <Loader className="size-8 animate-spin text-muted-foreground" />
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
          <CardTitle>Deletion failed</CardTitle>
        </div>
        <CardDescription>
          {mutation.error?.message ||
            "This deletion link is invalid or has expired."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 px-0 pb-0 mt-6">
        <Link href="/">
          <Button variant="outline" className="w-full">
            <ArrowLeft className="size-4 mr-2" />
            Return Home
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};
