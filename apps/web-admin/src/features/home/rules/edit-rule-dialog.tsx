import { useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";

import { getListRulesQueryKey, useUpdateRule } from "@/api/generated/rules/rules";
import type { RuleResponseDto } from "@/api/generated/model";
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
import { Textarea } from "@/components/ui/textarea";
import { RULE_BODY_MAX, RULE_TITLE_MAX } from "@/lib/admin/text-limits";
import { cn } from "@/lib/utils";

// Mounted only while editing (parent unmounts on close) → fresh state per open.
export function EditRuleDialog({
  rule,
  open,
  onOpenChange,
}: {
  rule: RuleResponseDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const mutation = useUpdateRule({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getListRulesQueryKey() });
        toast.success("Rule saved");
        onOpenChange(false);
      },
      onError: () => toast.error("Failed to save rule"),
    },
  });

  const [title, setTitle] = useState(rule.title);
  const [body, setBody] = useState(rule.body ?? "");
  const [stepNumber, setStepNumber] = useState(rule.stepNumber);
  const [isVisible, setIsVisible] = useState(rule.isVisible);

  const titleChanged = title !== rule.title;
  const bodyChanged = body !== (rule.body ?? "");
  const stepChanged = stepNumber !== rule.stepNumber;
  const visibleChanged = isVisible !== rule.isVisible;
  const dirty = titleChanged || bodyChanged || stepChanged || visibleChanged;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate({
      id: rule.id,
      data: { title, body: body === "" ? null : body, stepNumber, isVisible },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit rule</DialogTitle>
            <DialogDescription>A step shown on the public Rules section.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="edit-rule-visible"
                checked={isVisible}
                onCheckedChange={(v) => setIsVisible(v === true)}
              />
              <Label htmlFor="edit-rule-visible">
                {labelTextWithHint(
                  "Visible",
                  visibleChanged,
                  "If off, fans don't see this step (it stays admin-only).",
                )}
              </Label>
            </div>

            <div>
              <FieldHeader
                htmlFor="edit-rule-title"
                label={labelTextWithHint("Title", titleChanged, "Heading of the rule step.")}
                current={title.length}
                max={RULE_TITLE_MAX}
              />
              <Input
                id="edit-rule-title"
                value={title}
                maxLength={RULE_TITLE_MAX}
                className={dirtyFieldClass(titleChanged)}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <FieldHeader
                htmlFor="edit-rule-body"
                label={labelTextWithHint(
                  "Body",
                  bodyChanged,
                  "Explanation text under the rule heading.",
                )}
                current={body.length}
                max={RULE_BODY_MAX}
              />
              <Textarea
                id="edit-rule-body"
                value={body}
                maxLength={RULE_BODY_MAX}
                rows={3}
                className={dirtyFieldClass(bodyChanged)}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="edit-rule-step" className="mb-1">
                {labelText("Step number", stepChanged)}
              </Label>
              <Input
                id="edit-rule-step"
                type="number"
                min={0}
                className={cn("w-24", dirtyFieldClass(stepChanged))}
                value={stepNumber}
                onChange={(e) => setStepNumber(Number(e.target.value))}
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
