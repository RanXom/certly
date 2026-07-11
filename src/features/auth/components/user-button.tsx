"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Loader,
  LogOut,
  RotateCcwKey,
  User2,
  TriangleAlert,
  Mail,
} from "lucide-react";

import { ProfileDialog } from "./profile-dialog";
import { ChangePasswordDialog } from "./change-password-dialog";
import { useResendVerification } from "../hooks/use-resend-verification";

export const UserButton = () => {
  const session = useSession();
  const [profileOpen, setProfileOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const resendMutation = useResendVerification();

  if (session.status === "loading") {
    return <Loader className="size-4 animate-spin text-muted-foreground" />;
  }

  if (session.status === "unauthenticated" || !session.data) {
    return null;
  }

  const name = session.data?.user?.name ?? "";
  const imageUrl = session.data?.user?.image ?? "";
  const emailVerified = session.data?.user?.emailVerified;

  // A credential user who hasn't verified their email
  const isUnverified = !emailVerified;

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger>
          <Avatar className="size-10 hover:opacity-75 transition">
            <AvatarImage alt={name} src={imageUrl || ""} />
            <AvatarFallback className="bg-blue-500 font-medium text-white">
              {name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          {isUnverified && (
            <>
              <DropdownMenuLabel className="p-0">
                <div className="bg-amber-500/15 px-3 py-2 flex items-start gap-2 rounded-sm">
                  <TriangleAlert className="size-4 text-amber-600 mt-0.5 shrink-0" />
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-amber-700">
                      Email not verified
                    </span>
                    <button
                      onClick={() =>
                        resendMutation.mutate(undefined, {
                          onSuccess: () => {
                            session.update();
                          },
                        })
                      }
                      disabled={resendMutation.isPending}
                      className="text-xs text-amber-600 hover:text-amber-800 underline text-left cursor-pointer disabled:opacity-50"
                    >
                      {resendMutation.isPending ? (
                        <span className="flex items-center gap-1">
                          <Loader className="size-3 animate-spin" />
                          Sending...
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Mail className="size-3" />
                          Resend verification email
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </DropdownMenuLabel>
              <Separator className="my-1" />
            </>
          )}
          <DropdownMenuItem
            onClick={() => setProfileOpen(true)}
            className="h-10"
            disabled={isUnverified}
          >
            <User2 className="size-4 mr-2" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setChangePasswordOpen(true)}
            className="h-10"
            disabled={isUnverified}
          >
            <RotateCcwKey className="size-4 mr-2" />
            Change Password
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => signOut()} className="h-10">
            <LogOut className="size-4 mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
      <ChangePasswordDialog
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
      />
    </>
  );
};
