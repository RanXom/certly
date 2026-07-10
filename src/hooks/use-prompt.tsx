import { JSX, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export const usePrompt = (
  title: string,
  message: string,
): [JSX.Element, (defaultValue?: string) => Promise<string | null>] => {
  const [value, setValue] = useState("");

  const [promise, setPromise] = useState<{
    resolve: (value: string | null) => void;
  } | null>(null);

  const prompt = (defaultValue = "") => {
    setValue(defaultValue);

    return new Promise<string | null>((resolve) => {
      setPromise({ resolve });
    });
  };

  const handleClose = () => {
    setPromise(null);
    setValue("");
  };

  const handleConfirm = () => {
    promise?.resolve(value.trim());
    handleClose();
  };

  const handleCancel = () => {
    promise?.resolve(null);
    handleClose();
  };

  const dialog = (
    <Dialog
      open={promise !== null}
      onOpenChange={(open) => {
        if (!open) handleCancel();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>

        <Input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleConfirm();
            }
          }}
        />

        <DialogFooter className="pt-2">
          <Button onClick={handleCancel} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!value.trim()}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return [dialog, prompt];
};
