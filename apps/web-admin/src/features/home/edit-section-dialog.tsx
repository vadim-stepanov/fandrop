import { useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";

import { getListHomeSectionsQueryKey, useUpdateHomeSection } from "@/api/generated/home/home";
import type { HomeSectionResponseDto } from "@/api/generated/model";
import {
  FieldHeader,
  dirtyFieldClass,
  labelText,
  labelTextWithHint,
} from "@/components/field-label";
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
import { HOME_SECTION_SUBTITLE_MAX, HOME_SECTION_TITLE_MAX } from "@/lib/admin/text-limits";
import { cn } from "@/lib/utils";

// Mounted only while editing (parent unmounts on close), so the form state
// initializes fresh from `section` on every open.
export function EditSectionDialog({
  section,
  open,
  onOpenChange,
}: {
  section: HomeSectionResponseDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const mutation = useUpdateHomeSection({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getListHomeSectionsQueryKey() });
        toast.success("Section saved");
        onOpenChange(false);
      },
      onError: () => toast.error("Failed to save section"),
    },
  });

  const [isVisible, setIsVisible] = useState(section.isVisible);
  const [sortOrder, setSortOrder] = useState(section.sortOrder);
  const [title, setTitle] = useState(section.title ?? "");
  const [subtitle, setSubtitle] = useState(section.subtitle ?? "");

  const visibleChanged = isVisible !== section.isVisible;
  const orderChanged = sortOrder !== section.sortOrder;
  const titleChanged = title !== (section.title ?? "");
  const subtitleChanged = subtitle !== (section.subtitle ?? "");
  const dirty = visibleChanged || orderChanged || titleChanged || subtitleChanged;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate({
      id: section.id,
      data: {
        isVisible,
        sortOrder,
        title: title === "" ? null : title,
        subtitle: subtitle === "" ? null : subtitle,
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit {section.key} section</DialogTitle>
            <DialogDescription>
              Shell properties for this section card on the public Home page.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="section-visible"
                checked={isVisible}
                onCheckedChange={(v) => setIsVisible(v === true)}
              />
              <Label htmlFor="section-visible">
                {labelTextWithHint(
                  "Visible",
                  visibleChanged,
                  "If off, fans don't see this section (it stays admin-only).",
                )}
              </Label>
            </div>

            <div>
              <FieldHeader
                htmlFor="section-title"
                label={labelTextWithHint(
                  "Title",
                  titleChanged,
                  "Shown as the section heading on the public Home page.",
                )}
                current={title.length}
                max={HOME_SECTION_TITLE_MAX}
              />
              <Input
                id="section-title"
                value={title}
                maxLength={HOME_SECTION_TITLE_MAX}
                placeholder="Section title"
                className={dirtyFieldClass(titleChanged)}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <FieldHeader
                htmlFor="section-subtitle"
                label={labelTextWithHint(
                  "Subtitle",
                  subtitleChanged,
                  "Shown under the section heading on Home. Optional.",
                )}
                current={subtitle.length}
                max={HOME_SECTION_SUBTITLE_MAX}
              />
              <Input
                id="section-subtitle"
                value={subtitle}
                maxLength={HOME_SECTION_SUBTITLE_MAX}
                placeholder="Optional"
                className={dirtyFieldClass(subtitleChanged)}
                onChange={(e) => setSubtitle(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="section-order" className="mb-1">
                {labelText("Order", orderChanged)}
              </Label>
              <Input
                id="section-order"
                type="number"
                min={0}
                value={sortOrder}
                className={cn("w-24", dirtyFieldClass(orderChanged))}
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
