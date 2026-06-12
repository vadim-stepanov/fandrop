import { type ReactNode, createContext, useCallback, useContext, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// Promise-based confirm dialog (shadcn Dialog under the hood). Mounts one
// dialog at the provider; call sites `await confirm({...})` → boolean.
// Dialog (not AlertDialog) so overlay-click / ESC / X count as Cancel.

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used inside <ConfirmDialogProvider>");
  }
  return ctx;
}

interface PendingState {
  options: ConfirmOptions;
  resolve: (ok: boolean) => void;
}

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingState | null>(null);

  const confirm = useCallback<ConfirmFn>(
    (options) => new Promise<boolean>((resolve) => setPending({ options, resolve })),
    [],
  );

  function handleOpenChange(open: boolean) {
    if (open) {
      return;
    }
    // Close (overlay / ESC / X / Cancel) resolves false unless confirm already cleared it.
    if (pending) {
      pending.resolve(false);
      setPending(null);
    }
  }

  function handleConfirm() {
    if (!pending) {
      return;
    }
    pending.resolve(true);
    setPending(null);
  }

  const opts = pending?.options;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      <Dialog open={pending !== null} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{opts?.title}</DialogTitle>
            {opts?.description ? <DialogDescription>{opts.description}</DialogDescription> : null}
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              {opts?.cancelLabel ?? "Cancel"}
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              className={cn(
                opts?.destructive &&
                  "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600/40",
              )}
            >
              {opts?.confirmLabel ?? "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}
