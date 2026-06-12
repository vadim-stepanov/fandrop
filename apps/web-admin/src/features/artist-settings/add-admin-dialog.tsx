import { useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";

import {
  getListArtistAdminsQueryKey,
  useAddArtistAdmin,
} from "@/api/generated/artist-settings/artist-settings";
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
import { Label } from "@/components/ui/label";

export function AddAdminDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");

  const mutation = useAddArtistAdmin({
    mutation: {
      onSuccess: (result) => {
        void queryClient.invalidateQueries({ queryKey: getListArtistAdminsQueryKey() });
        toast.success(
          result.status === "instant"
            ? "Admin added"
            : "Invitation saved — applied on their first sign-in",
        );
        setEmail("");
        onOpenChange(false);
      },
      onError: () => toast.error("Failed to add admin"),
    },
  });

  const valid = /^\S+@\S+\.\S+$/.test(email.trim());

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (valid) {
      mutation.mutate({ data: { email: email.trim() } });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add artist admin</DialogTitle>
            <DialogDescription>
              If they've already joined this artist they get access immediately; otherwise the
              invite applies on their first sign-in.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="admin-email" className="mb-1">
              Email
            </Label>
            <Input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!valid || mutation.isPending}>
              {mutation.isPending ? "Adding…" : "Add admin"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
