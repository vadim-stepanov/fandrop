import { type DragEvent, useRef, useState } from "react";
import { toast } from "sonner";

import { uploadErrorMessage, uploadMedia } from "@/lib/admin/upload";
import { cn } from "@/lib/utils";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);

interface Props {
  currentUrl: string;
  onChange: (url: string) => void;
  emptyStateHint?: string;
  labelDimensions?: string;
}

// Admin image upload: picks a file, uploads to api-admin, reports the public
// URL up via onChange. The URL is only staged into the parent form — it must
// still be Saved to persist.
export function ImageUploadField({
  currentUrl,
  onChange,
  emptyStateHint = "PNG, JPG, or WebP · up to 5MB",
  labelDimensions,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, setIsPending] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  function openPicker() {
    inputRef.current?.click();
  }

  function onDragOver(event: DragEvent) {
    event.preventDefault();
    if (!isDragging) {
      setIsDragging(true);
    }
  }
  function onDragLeave(event: DragEvent) {
    event.preventDefault();
    setIsDragging(false);
  }
  function onDrop(event: DragEvent) {
    event.preventDefault();
    setIsDragging(false);
    void handleFile(event.dataTransfer.files?.[0]);
  }

  function clear() {
    onChange("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function handleFile(file: File | null | undefined) {
    if (!file) {
      return;
    }
    if (!ALLOWED_MIME.has(file.type)) {
      toast.error("Unsupported file type", { description: "Use PNG, JPG, or WebP." });
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("File too large", {
        description: `Max 5MB. This file is ${(file.size / 1024 / 1024).toFixed(1)}MB.`,
      });
      return;
    }
    setIsPending(true);
    try {
      const url = await uploadMedia("image", file);
      onChange(url);
      toast.success("Image uploaded — save the form to persist.");
    } catch (err) {
      toast.error("Upload failed", { description: uploadErrorMessage(err) });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div
      className={cn("space-y-2 rounded-xl", isDragging && "ring-2 ring-primary ring-offset-2")}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />

      {currentUrl ? (
        <div className="flex items-start gap-3 rounded-xl border border-border bg-background p-3">
          <img
            src={currentUrl}
            alt="Uploaded preview"
            className="size-20 rounded-lg object-cover"
          />
          <div className="flex-1 space-y-1 text-xs text-muted-foreground">
            <div className="break-all">{currentUrl}</div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={openPicker}
                disabled={isPending}
                className="rounded-md border border-border bg-background px-2 py-1 text-xs font-medium transition hover:bg-muted disabled:opacity-60"
              >
                {isPending ? "Uploading…" : "Replace"}
              </button>
              <button
                type="button"
                onClick={clear}
                disabled={isPending}
                className="rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-muted-foreground transition hover:bg-muted disabled:opacity-60"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          disabled={isPending}
          className="flex w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border bg-background px-4 py-6 text-sm text-muted-foreground transition hover:border-muted-foreground/40 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="font-medium">{isPending ? "Uploading…" : "Upload image"}</span>
          <span className="text-xs text-muted-foreground">{emptyStateHint}</span>
          {labelDimensions ? (
            <span className="text-xs text-muted-foreground/70">{labelDimensions}</span>
          ) : null}
        </button>
      )}
    </div>
  );
}
