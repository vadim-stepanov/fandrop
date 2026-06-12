import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";

import { getListRulesQueryKey, useCreateRule } from "@/api/generated/rules/rules";
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
import { Textarea } from "@/components/ui/textarea";
import { RULE_BODY_MAX, RULE_ITEMS_MAX, RULE_TITLE_MAX } from "@/lib/admin/text-limits";

export function CreateRuleDialog({ nextStep, atLimit }: { nextStep: number; atLimit: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button disabled={atLimit} onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Add rule
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <CreateRuleForm nextStep={nextStep} onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}

function CreateRuleForm({ nextStep, onDone }: { nextStep: number; onDone: () => void }) {
  const queryClient = useQueryClient();
  const mutation = useCreateRule({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getListRulesQueryKey() });
        toast.success("Rule created");
        onDone();
      },
      onError: () => toast.error("Failed to create rule"),
    },
  });

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [stepNumber, setStepNumber] = useState(nextStep);
  const [isVisible, setIsVisible] = useState(true);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate({ data: { title, body: body === "" ? null : body, stepNumber, isVisible } });
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Add rule</DialogTitle>
        <DialogDescription>
          Max {RULE_ITEMS_MAX} rules. Step number controls the order on the public Rules section.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="rule-visible"
            checked={isVisible}
            onCheckedChange={(v) => setIsVisible(v === true)}
          />
          <Label htmlFor="rule-visible">
            {labelTextWithHint(
              "Visible",
              false,
              "If off, fans don't see this step (it stays admin-only).",
            )}
          </Label>
        </div>

        <div>
          <FieldHeader
            htmlFor="rule-title"
            label={labelTextWithHint("Title", false, "Heading of the rule step.")}
            current={title.length}
            max={RULE_TITLE_MAX}
          />
          <Input
            id="rule-title"
            value={title}
            maxLength={RULE_TITLE_MAX}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <FieldHeader
            htmlFor="rule-body"
            label={labelTextWithHint("Body", false, "Explanation text under the rule heading.")}
            current={body.length}
            max={RULE_BODY_MAX}
          />
          <Textarea
            id="rule-body"
            value={body}
            maxLength={RULE_BODY_MAX}
            rows={3}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="rule-step" className="mb-1">
            Step number
          </Label>
          <Input
            id="rule-step"
            type="number"
            min={0}
            className="w-24"
            value={stepNumber}
            onChange={(e) => setStepNumber(Number(e.target.value))}
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={title.trim() === "" || mutation.isPending}>
          {mutation.isPending ? "Creating…" : "Create rule"}
        </Button>
      </DialogFooter>
    </form>
  );
}
