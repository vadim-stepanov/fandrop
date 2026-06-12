"use client";

import { Camera, Loader2 } from "lucide-react";
// Aliased: this file also uses the DOM `new Image()` (canvas crop) below.
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import { type ChangeEvent, useCallback, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { toast } from "sonner";

import { toUploadPath } from "@/lib/media";
import { removeAvatarAction, uploadAvatarAction } from "./actions";

const OUTPUT_SIZE = 512;

function getInitials(name: string): string {
  const parts = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
  return parts || "?";
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", () => reject(new Error("Could not load image")));
    img.src = src;
  });
}

// Crop the selected area to a square OUTPUT_SIZE JPEG blob.
async function getCroppedBlob(src: string, area: Area): Promise<Blob> {
  const image = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas not supported");
  }
  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not export image"))),
      "image/jpeg",
      0.9,
    );
  });
}

export function ProfileAvatar({
  avatarUrl,
  displayName,
  artistSlug,
}: {
  avatarUrl: string | null;
  displayName: string;
  artistSlug: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [isPending, setIsPending] = useState(false);

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedArea(areaPixels);
  }, []);

  function onPickFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow re-selecting the same file
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setImageSrc(typeof reader.result === "string" ? reader.result : null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    });
    reader.readAsDataURL(file);
  }

  function closeModal() {
    setImageSrc(null);
    setCroppedArea(null);
  }

  async function handleSave() {
    if (!imageSrc || !croppedArea) {
      return;
    }
    setIsPending(true);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedArea);
      const formData = new FormData();
      formData.append("file", new File([blob], "avatar.jpg", { type: "image/jpeg" }));
      const result = await uploadAvatarAction(artistSlug, formData);
      if (result.kind === "error") {
        toast.error(result.reason);
        return;
      }
      toast.success("Photo updated");
      closeModal();
      router.refresh();
    } catch {
      toast.error("Could not process the image");
    } finally {
      setIsPending(false);
    }
  }

  async function handleRemove() {
    setIsPending(true);
    try {
      const result = await removeAvatarAction(artistSlug);
      if (result.kind === "error") {
        toast.error(result.reason);
        return;
      }
      toast.success("Photo removed");
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="group relative size-24 shrink-0 overflow-hidden rounded-2xl bg-secondary text-secondary-foreground ring-2 ring-primary/40 md:size-28">
        {avatarUrl ? (
          <NextImage
            src={toUploadPath(avatarUrl)}
            alt=""
            fill
            sizes="112px"
            className="object-cover"
          />
        ) : (
          <span className="flex size-full items-center justify-center font-heading text-2xl font-bold md:text-3xl">
            {getInitials(displayName)}
          </span>
        )}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Change photo"
          className="absolute inset-0 flex items-center justify-center bg-black/45 text-white opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100"
        >
          <Camera className="size-6" aria-hidden />
        </button>
      </div>

      <div className="flex items-center gap-3 text-xs">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="font-medium text-primary hover:underline"
        >
          Change photo
        </button>
        {avatarUrl ? (
          <button
            type="button"
            onClick={() => void handleRemove()}
            disabled={isPending}
            className="text-muted-foreground hover:text-foreground hover:underline disabled:opacity-50"
          >
            Remove
          </button>
        ) : null}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={onPickFile}
        className="hidden"
      />

      {imageSrc ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Crop your photo"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
        >
          <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-card text-card-foreground shadow-xl">
            <div className="border-b border-border px-4 py-3">
              <h2 className="font-heading text-base font-bold">Crop your photo</h2>
            </div>

            <div className="relative h-72 bg-zinc-900">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            <div className="px-4 py-3">
              <label className="mb-1 block text-xs text-muted-foreground">Zoom</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-border bg-muted/40 px-4 py-3">
              <button
                type="button"
                onClick={closeModal}
                disabled={isPending}
                className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
              >
                {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
