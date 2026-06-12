import { MoreHorizontal, type LucideIcon } from "lucide-react";
import { Fragment } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Standard 3-dot row action menu (Linear / Stripe / Shopify Admin pattern).
// Items group as regular / separator / destructive (red).
export type RowAction = {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  /** Renders a separator above this item — use to set off destructive actions. */
  separatorBefore?: boolean;
  /** Red text + hover — for delete / wipe / void. */
  destructive?: boolean;
  disabled?: boolean;
};

export function RowActionsMenu({
  actions,
  ariaLabel = "Open actions menu",
}: {
  actions: RowAction[];
  ariaLabel?: string;
}) {
  if (actions.length === 0) {
    return null;
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8" aria-label={ariaLabel}>
          <MoreHorizontal className="size-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {actions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <Fragment key={action.label}>
              {action.separatorBefore && idx > 0 ? <DropdownMenuSeparator /> : null}
              <DropdownMenuItem
                onClick={action.onClick}
                disabled={action.disabled}
                className={
                  action.destructive
                    ? "text-destructive focus:bg-destructive/10 focus:text-destructive"
                    : undefined
                }
              >
                {Icon ? <Icon aria-hidden /> : null}
                {action.label}
              </DropdownMenuItem>
            </Fragment>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
