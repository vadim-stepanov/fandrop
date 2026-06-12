import { useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";

import {
  getListQuestsQueryKey,
  useCreateQuest,
  useUpdateQuest,
} from "@/api/generated/quests/quests";
import type { QuestResponseDto } from "@/api/generated/model";
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
import { Textarea } from "@/components/ui/textarea";
import { toDateTimeLocalValue } from "@/lib/datetime";

const TITLE_MAX = 160;
const DESCRIPTION_MAX = 500;
const LINK_MAX = 2048;

function orNull(value: string): string | null {
  return value.trim() === "" ? null : value.trim();
}

function toInt(value: string): number {
  const n = Number(value.trim());
  return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0;
}

// Remounted per open (parent passes key) → fresh baseline from `quest`.
export function QuestEditorDialog({
  quest,
  open,
  onOpenChange,
}: {
  quest?: QuestResponseDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isEdit = Boolean(quest);
  const queryClient = useQueryClient();
  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: getListQuestsQueryKey() });

  const createMutation = useCreateQuest({
    mutation: {
      onSuccess: () => {
        invalidate();
        toast.success("Quest created");
        onOpenChange(false);
      },
      onError: () => toast.error("Failed to create quest"),
    },
  });
  const updateMutation = useUpdateQuest({
    mutation: {
      onSuccess: () => {
        invalidate();
        toast.success("Quest saved");
        onOpenChange(false);
      },
      onError: () => toast.error("Failed to save quest"),
    },
  });

  const [title, setTitle] = useState(quest?.title ?? "");
  const [description, setDescription] = useState(quest?.description ?? "");
  const [link, setLink] = useState(quest?.link ?? "");
  const [imageUrl, setImageUrl] = useState(quest?.imageUrl ?? "");
  const [rewardPoints, setRewardPoints] = useState(String(quest?.rewardPoints ?? 0));
  const [availableAt, setAvailableAt] = useState(toDateTimeLocalValue(quest?.availableAt));
  const [featuredPos, setFeaturedPos] = useState(String(quest?.featuredPos ?? 0));
  const [isVisible, setIsVisible] = useState(quest?.isVisible ?? true);

  const changed = {
    title: title !== (quest?.title ?? ""),
    description: description !== (quest?.description ?? ""),
    link: link !== (quest?.link ?? ""),
    imageUrl: imageUrl !== (quest?.imageUrl ?? ""),
    rewardPoints: rewardPoints !== String(quest?.rewardPoints ?? 0),
    availableAt: availableAt !== toDateTimeLocalValue(quest?.availableAt),
    featuredPos: featuredPos !== String(quest?.featuredPos ?? 0),
    isVisible: isVisible !== (quest?.isVisible ?? true),
  };
  const dirty = Object.values(changed).some(Boolean);
  const isPending = createMutation.isPending || updateMutation.isPending;
  const canSubmit = title.trim() !== "" && link.trim() !== "" && (!isEdit || dirty) && !isPending;
  const mark = (c: boolean) => isEdit && c;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const data = {
      title: title.trim(),
      description: orNull(description),
      link: link.trim(),
      imageUrl: orNull(imageUrl),
      rewardPoints: toInt(rewardPoints),
      availableAt: availableAt ? new Date(availableAt).toISOString() : null,
      featuredPos: toInt(featuredPos),
      isVisible,
    };
    if (quest) {
      updateMutation.mutate({ id: quest.id, data });
    } else {
      createMutation.mutate({ data });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit quest" : "New quest"}</DialogTitle>
            <DialogDescription>
              “Visit a link → claim points.” The Start button opens the link and marks the quest
              complete; fans then claim the reward.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <FieldHeader
                htmlFor="q-title"
                label={labelTextWithHint(
                  "Title",
                  mark(changed.title),
                  "Quest name on the card. Renders on one line.",
                )}
                current={title.length}
                max={TITLE_MAX}
              />
              <Input
                id="q-title"
                value={title}
                maxLength={TITLE_MAX}
                className={dirtyFieldClass(mark(changed.title))}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <FieldHeader
                htmlFor="q-description"
                label={labelText("Description", mark(changed.description))}
                current={description.length}
                max={DESCRIPTION_MAX}
              />
              <Textarea
                id="q-description"
                rows={2}
                value={description}
                maxLength={DESCRIPTION_MAX}
                className={dirtyFieldClass(mark(changed.description))}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="q-link" className="mb-1">
                {labelTextWithHint(
                  "Link",
                  mark(changed.link),
                  "The URL fans open when they start the quest.",
                )}
              </Label>
              <Input
                id="q-link"
                type="url"
                placeholder="https://…"
                value={link}
                maxLength={LINK_MAX}
                className={dirtyFieldClass(mark(changed.link))}
                onChange={(e) => setLink(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="mb-1">{labelText("Image", mark(changed.imageUrl))}</Label>
                <ImageUploadField
                  currentUrl={imageUrl}
                  onChange={setImageUrl}
                  labelDimensions="Recommended 600×600"
                />
              </div>
              <div className="grid content-start gap-4">
                <div>
                  <Label htmlFor="q-reward" className="mb-1">
                    {labelTextWithHint(
                      "Reward points",
                      mark(changed.rewardPoints),
                      "Points credited when the fan claims this quest.",
                    )}
                  </Label>
                  <Input
                    id="q-reward"
                    type="number"
                    min={0}
                    value={rewardPoints}
                    className={dirtyFieldClass(mark(changed.rewardPoints))}
                    onChange={(e) => setRewardPoints(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="q-featured" className="mb-1">
                    {labelTextWithHint(
                      "Featured position",
                      mark(changed.featuredPos),
                      "Position in the Quests block on Home. 0 = not shown on Home.",
                    )}
                  </Label>
                  <Input
                    id="q-featured"
                    type="number"
                    min={0}
                    value={featuredPos}
                    className={dirtyFieldClass(mark(changed.featuredPos))}
                    onChange={(e) => setFeaturedPos(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="q-available" className="mb-1">
                {labelTextWithHint(
                  "Available at",
                  mark(changed.availableAt),
                  "Quest shows as “Coming Soon” until this time. Empty = available now.",
                )}
              </Label>
              <Input
                id="q-available"
                type="datetime-local"
                value={availableAt}
                className={dirtyFieldClass(mark(changed.availableAt))}
                onChange={(e) => setAvailableAt(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="q-visible"
                checked={isVisible}
                onCheckedChange={(v) => setIsVisible(v === true)}
              />
              <Label htmlFor="q-visible">
                {labelTextWithHint(
                  "Visible",
                  mark(changed.isVisible),
                  "If off, fans don't see this quest (it stays admin-only).",
                )}
              </Label>
            </div>
          </div>

          <DialogFooter className="border-t bg-muted/50 -mx-6 -mb-6 px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isPending ? "Saving…" : isEdit ? "Save" : "Create quest"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
