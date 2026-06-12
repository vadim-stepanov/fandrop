import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";

import {
  getListSocialLinksQueryKey,
  useCreateSocialLink,
  useListSocialPlatformCatalog,
} from "@/api/generated/social-links/social-links";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SOCIAL_LINKS_MAX } from "@/lib/admin/text-limits";

const DEFAULT_BONUS = 500;

export function AddSocialDialog({
  existingPlatformIds,
  linkCount,
  nextSort,
}: {
  existingPlatformIds: string[];
  linkCount: number;
  nextSort: number;
}) {
  const [open, setOpen] = useState(false);
  const { data: catalog } = useListSocialPlatformCatalog();

  const available = (catalog ?? []).filter((p) => !existingPlatformIds.includes(p.id));
  const atLimit = linkCount >= SOCIAL_LINKS_MAX;
  const disabled = atLimit || available.length === 0;
  const disabledHint = atLimit
    ? `Limit reached (${SOCIAL_LINKS_MAX}). Remove one to add another.`
    : available.length === 0
      ? "All platforms are already added."
      : null;

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={disabled} title={disabledHint ?? undefined}>
        <Plus className="size-4" />
        Add social
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          {open ? (
            <AddSocialForm
              available={available}
              nextSort={nextSort}
              onDone={() => setOpen(false)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function AddSocialForm({
  available,
  nextSort,
  onDone,
}: {
  available: { id: string; label: string }[];
  nextSort: number;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const mutation = useCreateSocialLink({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getListSocialLinksQueryKey() });
        toast.success("Social added");
        onDone();
      },
      onError: () => toast.error("Failed to add social"),
    },
  });

  const [socialPlatformId, setSocialPlatformId] = useState("");
  const [connectBonus, setConnectBonus] = useState(DEFAULT_BONUS);
  const [isVisible, setIsVisible] = useState(true);

  // Derived (no effect): default to the first available platform until the user
  // picks one explicitly.
  const effectivePlatformId = socialPlatformId || (available[0]?.id ?? "");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!effectivePlatformId) {
      return;
    }
    mutation.mutate({
      data: { socialPlatformId: effectivePlatformId, connectBonus, isVisible, sortOrder: nextSort },
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Add social platform</DialogTitle>
        <DialogDescription>
          Members can connect this platform on their profile and earn the connect bonus once.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-4">
        <div>
          <Label className="mb-1">Platform</Label>
          <Select value={effectivePlatformId} onValueChange={setSocialPlatformId}>
            <SelectTrigger>
              <SelectValue placeholder="Pick a platform" />
            </SelectTrigger>
            <SelectContent>
              {available.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <FieldHeader
            htmlFor="social-bonus"
            label={labelTextWithHint(
              "Connect bonus",
              false,
              "Points awarded the first time a member connects this platform.",
            )}
          />
          <Input
            id="social-bonus"
            type="number"
            min={0}
            className="w-32"
            value={connectBonus}
            onChange={(e) => setConnectBonus(Number(e.target.value))}
          />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="social-visible"
            checked={isVisible}
            onCheckedChange={(v) => setIsVisible(v === true)}
          />
          <Label htmlFor="social-visible">
            {labelTextWithHint(
              "Visible",
              false,
              "If off, fans don't see this platform (it stays admin-only).",
            )}
          </Label>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={!effectivePlatformId || mutation.isPending}>
          {mutation.isPending ? "Adding…" : "Add social"}
        </Button>
      </DialogFooter>
    </form>
  );
}
