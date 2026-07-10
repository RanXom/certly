"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader, LogOut, User2 } from "lucide-react";

import { ProfileDialog } from "./profile-dialog";

export const UserButton = () => {
  const session = useSession();
  const [profileOpen, setProfileOpen] = useState(false);

  if (session.status === "loading") {
    return <Loader className="size-4 animate-spin text-muted-foreground" />;
  }

  if (session.status === "unauthenticated" || !session.data) {
    return null;
  }

  const name = session.data?.user?.name ?? "";
  const imageUrl = session.data?.user?.image ?? "";

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
          <DropdownMenuItem
            onClick={() => setProfileOpen(true)}
            className="h-10"
          >
            <User2 className="size-4 mr-2" />
            Profile
          </DropdownMenuItem>
          {/* TODO: Add a password reset button with it's dialog */}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut()} className="h-10">
            <LogOut className="size-4 mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
};
