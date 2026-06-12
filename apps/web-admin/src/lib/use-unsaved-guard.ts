import { useBlocker } from "@tanstack/react-router";
import { type RefObject, useEffect, useRef } from "react";

import { useConfirm } from "@/components/feedback/confirm-dialog-provider";

// Guard a page that has unsaved (dirty) form edits. In-app navigation is
// intercepted via TanStack Router's useBlocker → our confirm dialog; tab
// close/reload uses the browser's native dialog (enableBeforeUnload). Pass
// `bypassRef` and set it true right before a programmatic post-save redirect
// (e.g. create → edit page) so the guard doesn't block the form's own nav.
export function useUnsavedGuard(dirty: boolean, bypassRef?: RefObject<boolean>): void {
  const confirm = useConfirm();
  // Read the latest `dirty` at block-time (a navigation handler) without
  // re-registering the blocker; updated in an effect, not during render.
  const dirtyRef = useRef(dirty);
  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);

  const blocker = useBlocker({
    shouldBlockFn: () => dirtyRef.current && !(bypassRef?.current ?? false),
    enableBeforeUnload: () => dirtyRef.current && !(bypassRef?.current ?? false),
    withResolver: true,
  });

  useEffect(() => {
    if (blocker.status !== "blocked") {
      return;
    }
    const { proceed, reset } = blocker;
    let active = true;
    void confirm({
      title: "Discard unsaved changes?",
      description: "You have unsaved changes on this page. If you leave, they'll be lost.",
      confirmLabel: "Leave",
      cancelLabel: "Stay",
      destructive: true,
    }).then((ok) => {
      if (!active) {
        return;
      }
      if (ok) {
        proceed();
      } else {
        reset();
      }
    });
    return () => {
      active = false;
    };
    // Engage only when the block fires; confirm is stable, proceed/reset are
    // captured for this blocked instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocker.status]);
}
