import { Info } from "lucide-react";
import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Field-row header: label on the left, optional live character counter on the
// right (sits ABOVE the input). Use wherever an input has `maxLength`.
export function FieldHeader({
  label,
  htmlFor,
  current,
  max,
}: {
  label: ReactNode;
  htmlFor?: string;
  current?: number;
  max?: number;
}) {
  const showCounter = typeof current === "number" && typeof max === "number";
  return (
    <div className="mb-1 flex items-baseline justify-between gap-2">
      <Label htmlFor={htmlFor} className="text-foreground">
        {label}
      </Label>
      {showCounter ? <FieldCharCount current={current} max={max} /> : null}
    </div>
  );
}

// Standalone counter — switches to amber at the cap.
export function FieldCharCount({ current, max }: { current: number; max: number }) {
  const atCap = current >= max;
  return (
    <span className={`text-xs tabular-nums ${atCap ? "text-amber-600" : "text-muted-foreground"}`}>
      {current}/{max}
    </span>
  );
}

// Plain field label with an optional dirty-marker (`*` in amber).
export function labelText(label: string, changed: boolean): ReactNode {
  return (
    <span className="inline-flex items-center gap-1">
      <span>{label}</span>
      {changed ? <span className="text-amber-600">*</span> : null}
    </span>
  );
}

// Field label + a `?`-icon that opens a tooltip with the hint. For non-obvious
// fields. Pass `false` for `changed` in create-form contexts (no dirty state).
export function labelTextWithHint(label: string, changed: boolean, hint: string): ReactNode {
  return (
    <span className="inline-flex items-center gap-1">
      <span>{label}</span>
      {changed ? <span className="text-amber-600">*</span> : null}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={hint}
            // Inside a <Label>, a click would toggle/focus the labelled control.
            onClick={(e) => e.preventDefault()}
            className="inline-flex cursor-help items-center text-muted-foreground hover:text-foreground"
          >
            <Info className="size-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          {hint}
        </TooltipContent>
      </Tooltip>
    </span>
  );
}

// Amber highlight for a changed input/select/textarea — append to the field's
// className (tailwind-merge lets it override the base border/ring).
export function dirtyFieldClass(changed: boolean): string {
  return changed ? "border-amber-400 bg-amber-50 focus-visible:ring-amber-400/40" : "";
}
