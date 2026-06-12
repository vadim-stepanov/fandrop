import { useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";

import {
  getListSocialLinksQueryKey,
  useUpdateSocialLink,
} from "@/api/generated/social-links/social-links";
import type { ArtistSocialLinkResponseDto } from "@/api/generated/model";
import { FieldHeader, labelTextWithHint } from "@/components/field-label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

export function EditSocialDialog({
  link,
  open,
  onOpenChange,
}: {
  link: ArtistSocialLinkResponseDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const mutation = useUpdateSocialLink({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getListSocialLinksQueryKey() });
        toast.success("Social updated");
        onOpenChange(false);
      },
      onError: () => toast.error("Failed to update social"),
    },
  });

  const [connectBonus, setConnectBonus] = useState(link.connectBonus);
  const [sortOrder, setSortOrder] = useState(link.sortOrder);
  const [isVisible, setIsVisible] = useState(link.isVisible);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate({ id: link.id, data: { connectBonus, sortOrder, isVisible } });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit {link.socialPlatform.label}</DialogTitle>
            <DialogDescription>Connect bonus, visibility and display order.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <FieldHeader
                htmlFor="edit-social-bonus"
                label={labelTextWithHint(
                  "Connect bonus",
                  false,
                  "Points awarded the first time a member connects this platform.",
                )}
              />
              <Input
                id="edit-social-bonus"
                type="number"
                min={0}
                className="w-32"
                value={connectBonus}
                onChange={(e) => setConnectBonus(Number(e.target.value))}
              />
            </div>

            <div>
              <Label htmlFor="edit-social-sort" className="mb-1">
                Order
              </Label>
              <Input
                id="edit-social-sort"
                type="number"
                min={0}
                className="w-24"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="edit-social-visible"
                checked={isVisible}
                onCheckedChange={(v) => setIsVisible(v === true)}
              />
              <Label htmlFor="edit-social-visible">
                {labelTextWithHint(
                  "Visible",
                  false,
                  "If off, fans don't see this platform (it stays admin-only).",
                )}
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
