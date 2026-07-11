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
import { Loader, Mail, TriangleAlert, User2, Trash2 } from "lucide-react";

import { useUpdateUser } from "../hooks/use-update-user";
import { useRequestDeleteAccount } from "../hooks/use-request-delete-account";

// Persists across re-mounts caused by parent re-renders
let overriddenName: string | null = null;

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProfileDialog = ({ open, onOpenChange }: ProfileDialogProps) => {
  const session = useSession();
  const mutation = useUpdateUser();
  const deleteMutation = useRequestDeleteAccount();

  const user = session.data?.user;
  const isUnverified = !user?.emailVerified;
  const currentName = overriddenName ?? user?.name ?? "";
  const [name, setName] = useState(currentName);
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

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
    setIsConfirmingDelete(false);
  };

  const handleDeleteRequest = () => {
    deleteMutation.mutate(undefined, {
      onSuccess: () => {
        setIsConfirmingDelete(false);
      },
    });
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

        <Separator />

        {/* Danger Zone */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-medium text-destructive">
            <Trash2 className="size-4" />
            Danger Zone
          </Label>
          <div className="flex flex-col gap-2 rounded-md border border-destructive/20 p-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">Delete Account</span>
              <span className="text-xs text-muted-foreground">
                Permanently delete your account and all associated projects. This
                action cannot be undone.
              </span>
            </div>
            
            {isConfirmingDelete ? (
              <div className="flex flex-col gap-2 mt-2">
                <span className="text-xs font-medium text-destructive">
                  Are you absolutely sure? An email will be sent to confirm.
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setIsConfirmingDelete(false)}
                    disabled={deleteMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={handleDeleteRequest}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? (
                      <Loader className="size-4 animate-spin mr-2" />
                    ) : null}
                    Yes, Delete
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="destructive"
                size="sm"
                className="w-fit mt-2"
                onClick={() => setIsConfirmingDelete(true)}
                disabled={isUnverified || isEditing}
              >
                Delete Account
              </Button>
            )}
            
            {isUnverified && !isConfirmingDelete && (
              <span className="text-xs text-amber-600 mt-1">
                You must verify your email before you can delete your account.
              </span>
            )}
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
