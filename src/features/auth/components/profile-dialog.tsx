"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader, Mail, TriangleAlert, User2 } from "lucide-react";

import { useUpdateUser } from "../hooks/use-update-user";

// Persists across re-mounts caused by parent re-renders
let overriddenName: string | null = null;

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProfileDialog = ({ open, onOpenChange }: ProfileDialogProps) => {
  const session = useSession();
  const mutation = useUpdateUser();

  const user = session.data?.user;
  const isUnverified = !user?.emailVerified;
  const currentName = overriddenName ?? user?.name ?? "";
  const [name, setName] = useState(currentName);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    if (!name.trim()) return;

    mutation.mutate(
      { name: name.trim() },
      {
        onSuccess: () => {
          overriddenName = name.trim();
          setIsEditing(false);
        },
      },
    );
  };

  const handleCancel = () => {
    setName(currentName);
    setIsEditing(false);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
          <DialogDescription>
            View and manage your account details
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          <Avatar className="size-20">
            <AvatarImage alt={currentName} src={user.image || ""} />
            <AvatarFallback className="bg-blue-500 text-white text-2xl font-medium">
              {(currentName || "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        <Separator />

        {isUnverified && (
          <div className="bg-amber-500/15 p-3 rounded-md flex items-center gap-x-2 text-sm text-amber-700">
            <TriangleAlert className="size-4 shrink-0" />
            <p>Verify your email to edit your profile.</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="profile-name"
              className="flex items-center gap-2 text-sm font-medium"
            >
              <User2 className="size-4 text-muted-foreground" />
              Name
            </Label>
            {isEditing ? (
              <div className="flex gap-2">
                <Input
                  id="profile-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  disabled={mutation.isPending}
                  autoFocus
                />
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <span className="text-sm">{currentName || "Not set"}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="h-7 text-xs"
                  disabled={isUnverified}
                >
                  Edit
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Mail className="size-4 text-muted-foreground" />
              Email
            </Label>
            <div className="flex items-center rounded-md border px-3 py-2">
              <span className="text-sm text-muted-foreground">
                {user.email || "Not set"}
              </span>
            </div>
          </div>
        </div>

        {isEditing && (
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={mutation.isPending || !name.trim()}
            >
              {mutation.isPending ? (
                <Loader className="size-4 animate-spin mr-2" />
              ) : null}
              Save Changes
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
