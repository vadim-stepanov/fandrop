import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";

import {
  getListPartnerItemsQueryKey,
  useCreatePartnerItem,
} from "@/api/generated/partners/partners";
import { FieldHeader, labelTextWithHint } from "@/components/field-label";
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

const NAME_MAX = 120;
const URL_MAX = 500;

function orNull(value: string): string | null {
  return value.trim() === "" ? null : value;
}

export function CreatePartnerDialog({ nextSort }: { nextSort: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Add partner
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <CreatePartnerForm nextSort={nextSort} onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}

function CreatePartnerForm({ nextSort, onDone }: { nextSort: number; onDone: () => void }) {
  const queryClient = useQueryClient();
  const mutation = useCreatePartnerItem({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getListPartnerItemsQueryKey() });
        toast.success("Partner created");
        onDone();
      },
      onError: () => toast.error("Failed to create partner"),
    },
  });

  const [name, setName] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const [sortOrder, setSortOrder] = useState(nextSort);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate({
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
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Add partner</DialogTitle>
        <DialogDescription>
          A partner/sponsor logo shown on the public Partners section.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="partner-visible"
            checked={isVisible}
            onCheckedChange={(v) => setIsVisible(v === true)}
          />
          <Label htmlFor="partner-visible">
            {labelTextWithHint(
              "Visible",
              false,
              "If off, fans don't see this partner (it stays admin-only).",
            )}
          </Label>
        </div>

        <div>
          <FieldHeader
            htmlFor="partner-name"
            label={labelTextWithHint("Name", false, "Used as the logo alt text / fallback.")}
            current={name.length}
            max={NAME_MAX}
          />
          <Input
            id="partner-name"
            value={name}
            maxLength={NAME_MAX}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="partner-url" className="mb-1">
            External URL
          </Label>
          <Input
            id="partner-url"
            value={externalUrl}
            maxLength={URL_MAX}
            onChange={(e) => setExternalUrl(e.target.value)}
            placeholder="https://…"
          />
        </div>

        <div>
          <Label className="mb-1">Logo</Label>
          <ImageUploadField
            currentUrl={logoUrl}
            onChange={setLogoUrl}
            emptyStateHint="PNG/JPG/WebP ≤5MB · drag & drop or click"
            labelDimensions="Recommended 400×200"
          />
        </div>

        <div>
          <Label htmlFor="partner-sort" className="mb-1">
            Order
          </Label>
          <Input
            id="partner-sort"
            type="number"
            min={0}
            className="w-24"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={name.trim() === "" || mutation.isPending}>
          {mutation.isPending ? "Creating…" : "Create partner"}
        </Button>
      </DialogFooter>
    </form>
  );
}
