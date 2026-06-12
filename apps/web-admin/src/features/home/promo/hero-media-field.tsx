import { type DragEvent, useRef, useState } from "react";
import { toast } from "sonner";

import { uploadErrorMessage, uploadMedia } from "@/lib/admin/upload";
import { cn } from "@/lib/utils";

const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const VIDEO_MAX_BYTES = 15 * 1024 * 1024;
const IMAGE_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);
const VIDEO_MIME = new Set(["video/mp4"]);

interface Props {
  currentImageUrl: string;
  currentVideoUrl: string;
  onImageChange: (url: string) => void;
  onVideoChange: (url: string) => void;
}

// Unified hero-media slot — admin picks EITHER an image OR a video for the
// signed-in hero. Routes the upload by MIME and always clears the other slot,
// so exactly one of (bannerUrl, videoUrl) ends up set. Public render picks
// video over image.
export function HeroMediaField({
  currentImageUrl,
  currentVideoUrl,
  onImageChange,
  onVideoChange,
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

  function clearAll() {
    onImageChange("");
    onVideoChange("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function handleFile(file: File | null | undefined) {
    if (!file) {
      return;
    }
    const isImage = IMAGE_MIME.has(file.type);
    const isVideo = VIDEO_MIME.has(file.type);
    if (!isImage && !isVideo) {
      toast.error("Unsupported file type", { description: "Use PNG, JPG, WebP, or MP4." });
      return;
    }
    if (isImage && file.size > IMAGE_MAX_BYTES) {
      toast.error("Image too large", {
        description: `Max 5 MB. This file is ${(file.size / 1024 / 1024).toFixed(1)} MB.`,
      });
      return;
    }
    if (isVideo && file.size > VIDEO_MAX_BYTES) {
      toast.error("Video too large", {
        description: `Max 15 MB. This file is ${(file.size / 1024 / 1024).toFixed(1)} MB.`,
      });
      return;
    }

    setIsPending(true);
    try {
      if (isImage) {
        const url = await uploadMedia("image", file);
        onImageChange(url);
        onVideoChange("");
        toast.success("Image uploaded — save the form to persist.");
      } else {
        const url = await uploadMedia("video", file);
        onVideoChange(url);
        onImageChange("");
        toast.success("Video uploaded — save the form to persist.");
      }
    } catch (err) {
      toast.error("Upload failed", { description: uploadErrorMessage(err) });
    } finally {
      setIsPending(false);
    }
  }

  const hasVideo = Boolean(currentVideoUrl);
  const hasImage = !hasVideo && Boolean(currentImageUrl);

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
        accept="image/png,image/jpeg,image/webp,video/mp4"
        className="hidden"
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />

      {hasVideo ? (
        <MediaPreview
          label="Video"
          url={currentVideoUrl}
          isPending={isPending}
          onReplace={openPicker}
          onClear={clearAll}
        >
          <video
            src={currentVideoUrl}
            controls
            muted
            playsInline
            preload="metadata"
            className="h-24 w-32 rounded-lg bg-muted object-cover"
          />
        </MediaPreview>
      ) : hasImage ? (
        <MediaPreview
          label="Image"
          url={currentImageUrl}
          isPending={isPending}
          onReplace={openPicker}
          onClear={clearAll}
        >
          <img
            src={currentImageUrl}
            alt="Uploaded preview"
            className="size-20 rounded-lg object-cover"
          />
        </MediaPreview>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          disabled={isPending}
          className="flex w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border bg-background px-4 py-6 text-sm text-muted-foreground transition hover:border-muted-foreground/40 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="font-medium">{isPending ? "Uploading…" : "Upload image or video"}</span>
          <span className="text-xs text-muted-foreground">
            PNG/JPG/WebP ≤5 MB · MP4 ≤15 MB · 16:9 (1920×1080 recommended)
          </span>
        </button>
      )}
    </div>
  );
}

function MediaPreview({
  label,
  url,
  isPending,
  onReplace,
  onClear,
  children,
}: {
  label: string;
  url: string;
  isPending: boolean;
  onReplace: () => void;
  onClear: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-background p-3">
      {children}
      <div className="flex-1 space-y-1 text-xs text-muted-foreground">
        <div className="font-medium text-foreground">{label}</div>
        <div className="break-all">{url}</div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onReplace}
            disabled={isPending}
            className="rounded-md border border-border bg-background px-2 py-1 text-xs font-medium transition hover:bg-muted disabled:opacity-60"
          >
            {isPending ? "Uploading…" : "Replace"}
          </button>
          <button
            type="button"
            onClick={onClear}
            disabled={isPending}
            className="rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-muted-foreground transition hover:bg-muted disabled:opacity-60"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
