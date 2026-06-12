import { useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";

import {
  getListPartnerItemsQueryKey,
  useUpdatePartnerItem,
} from "@/api/generated/partners/partners";
import type { PartnerResponseDto } from "@/api/generated/model";
import {
  FieldHeader,
  dirtyFieldClass,
  labelText,
  labelTextWithHint,
} from "@/components/field-label";
import { ImageUploadField } from "@/components/image-upload-field";
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
import { cn } from "@/lib/utils";

const NAME_MAX = 120;
const URL_MAX = 500;

function orNull(value: string): string | null {
  return value.trim() === "" ? null : value;
}

// Mounted only while editing (parent unmounts on close) → fresh state per open.
export function EditPartnerDialog({
  partner,
  open,
  onOpenChange,
}: {
  partner: PartnerResponseDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const mutation = useUpdatePartnerItem({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getListPartnerItemsQueryKey() });
        toast.success("Partner saved");
        onOpenChange(false);
      },
      onError: () => toast.error("Failed to save partner"),
    },
  });

  const [name, setName] = useState(partner.name);
  const [externalUrl, setExternalUrl] = useState(partner.externalUrl ?? "");
  const [logoUrl, setLogoUrl] = useState(partner.logoUrl ?? "");
  const [isVisible, setIsVisible] = useState(partner.isVisible);
  const [sortOrder, setSortOrder] = useState(partner.sortOrder);

  const nameChanged = name !== partner.name;
  const urlChanged = externalUrl !== (partner.externalUrl ?? "");
  const logoChanged = logoUrl !== (partner.logoUrl ?? "");
  const visibleChanged = isVisible !== partner.isVisible;
  const sortChanged = sortOrder !== partner.sortOrder;
  const dirty = nameChanged || urlChanged || logoChanged || visibleChanged || sortChanged;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate({
      id: partner.id,
      data: {
        name,
        externalUrl: orNull(externalUrl),
        logoUrl: orNull(logoUrl),
        isVisible,
        sortOrder,
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit partner</DialogTitle>
            <DialogDescription>
              A partner/sponsor logo on the public Partners section.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="edit-partner-visible"
                checked={isVisible}
                onCheckedChange={(v) => setIsVisible(v === true)}
              />
              <Label htmlFor="edit-partner-visible">
                {labelTextWithHint(
                  "Visible",
                  visibleChanged,
                  "If off, fans don't see this partner (it stays admin-only).",
                )}
              </Label>
            </div>

            <div>
              <FieldHeader
                htmlFor="edit-partner-name"
                label={labelTextWithHint(
                  "Name",
                  nameChanged,
                  "Used as the logo alt text / fallback.",
                )}
                current={name.length}
                max={NAME_MAX}
              />
              <Input
                id="edit-partner-name"
                value={name}
                maxLength={NAME_MAX}
                className={dirtyFieldClass(nameChanged)}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-partner-url" className="mb-1">
                {labelText("External URL", urlChanged)}
              </Label>
              <Input
                id="edit-partner-url"
                value={externalUrl}
                maxLength={URL_MAX}
                className={dirtyFieldClass(urlChanged)}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://…"
              />
            </div>

            <div>
              <Label className="mb-1">{labelText("Logo", logoChanged)}</Label>
              <ImageUploadField
                currentUrl={logoUrl}
                onChange={setLogoUrl}
                emptyStateHint="PNG/JPG/WebP ≤5MB · drag & drop or click"
                labelDimensions="Recommended 400×200"
              />
            </div>

            <div>
              <Label htmlFor="edit-partner-sort" className="mb-1">
                {labelText("Order", sortChanged)}
              </Label>
              <Input
                id="edit-partner-sort"
                type="number"
                min={0}
                className={cn("w-24", dirtyFieldClass(sortChanged))}
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!dirty || mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
