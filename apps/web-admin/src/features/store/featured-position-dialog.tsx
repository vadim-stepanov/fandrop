import { useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";

import { getListStoreItemsQueryKey, useUpdateStoreItem } from "@/api/generated/store/store";
import type { StoreItemResponseDto } from "@/api/generated/model";
import { dirtyFieldClass, labelTextWithHint } from "@/components/field-label";
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

// Mounted only while editing (parent unmounts on close) → fresh state per open.
export function FeaturedPositionDialog({
  item,
  open,
  onOpenChange,
}: {
  item: StoreItemResponseDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const mutation = useUpdateStoreItem({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getListStoreItemsQueryKey() });
        toast.success("Featured position saved");
        onOpenChange(false);
      },
      onError: () => toast.error("Failed to save"),
    },
  });

  const [featuredPos, setFeaturedPos] = useState(String(item.featuredPos));
  const changed = featuredPos !== String(item.featuredPos);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const t = featuredPos.trim();
    const n = t === "" ? 0 : Number(t);
    mutation.mutate({
      id: item.id,
      data: { featuredPos: Number.isFinite(n) ? Math.trunc(n) : 0 },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Feature on Home</DialogTitle>
            <DialogDescription>
              “{item.title}” — position in the Store block on the public Home.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="featured-pos" className="mb-1">
                {labelTextWithHint(
                  "Featured position",
                  changed,
                  "1 = first. 0 hides this item from the Home Store block (still on the Store page).",
                )}
              </Label>
              <Input
                id="featured-pos"
                type="number"
                min={0}
                className={dirtyFieldClass(changed)}
                value={featuredPos}
                onChange={(e) => setFeaturedPos(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!changed || mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
