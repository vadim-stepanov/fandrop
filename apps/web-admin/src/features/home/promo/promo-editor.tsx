import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  getListPromoVariantsQueryKey,
  useCreatePromoVariant,
  useUpdatePromoVariant,
} from "@/api/generated/promo/promo";
import type { PromoResponseDto } from "@/api/generated/model";
import { HeroMediaField } from "@/features/home/promo/hero-media-field";
import { ImageUploadField } from "@/components/image-upload-field";
import { FieldHeader, dirtyFieldClass, labelText } from "@/components/field-label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toDateTimeLocalValue } from "@/lib/datetime";
import { useUnsavedGuard } from "@/lib/use-unsaved-guard";

const NAME_MAX = 80;
const TITLE_MAX = 160;
const SUBTITLE_MAX = 300;
const CTA_LABEL_MAX = 80;
const CTA_TEXT_MAX = 120;

function orNull(value: string): string | null {
  return value.trim() === "" ? null : value;
}

export function PromoEditor({ slug, variant }: { slug: string; variant?: PromoResponseDto }) {
  const isEdit = Boolean(variant);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: getListPromoVariantsQueryKey() });
  const backToList = () => void navigate({ to: "/admin/$slug/home/promo", params: { slug } });
  // Set before the post-create redirect so the unsaved-guard allows our own nav.
  const navBypass = useRef(false);

  const createMutation = useCreatePromoVariant({
    mutation: {
      onSuccess: (created) => {
        // Seed the list cache so the edit page finds the variant immediately
        // (no "not found" flash before the background refetch lands).
        queryClient.setQueryData<PromoResponseDto[]>(getListPromoVariantsQueryKey(), (old) =>
          old ? [...old, created] : [created],
        );
        invalidate();
        toast.success("Variant created");
        navBypass.current = true;
        void navigate({
          to: "/admin/$slug/home/promo/$variantId",
          params: { slug, variantId: created.id },
        });
      },
      onError: () => toast.error("Failed to create variant"),
    },
  });
  const updateMutation = useUpdatePromoVariant({
    mutation: {
      onSuccess: () => {
        invalidate();
        toast.success("Variant saved");
      },
      onError: () => toast.error("Failed to save variant"),
    },
  });

  const [name, setName] = useState(variant?.name ?? "");
  const [title, setTitle] = useState(variant?.title ?? "");
  const [subtitle, setSubtitle] = useState(variant?.subtitle ?? "");
  const [ctaLabel, setCtaLabel] = useState(variant?.ctaLabel ?? "");
  const [ctaUrl, setCtaUrl] = useState(variant?.ctaUrl ?? "");
  const [ctaText, setCtaText] = useState(variant?.ctaText ?? "");
  const [bannerUrl, setBannerUrl] = useState(variant?.bannerUrl ?? "");
  const [videoUrl, setVideoUrl] = useState(variant?.videoUrl ?? "");
  const [bannerUrlAnon, setBannerUrlAnon] = useState(variant?.bannerUrlAnon ?? "");
  const [eyebrow, setEyebrow] = useState(variant?.eyebrow ?? "");
  const [timer, setTimer] = useState(toDateTimeLocalValue(variant?.timerEndsAt));

  const initialTimer = toDateTimeLocalValue(variant?.timerEndsAt);
  const changed = {
    name: name !== (variant?.name ?? ""),
    title: title !== (variant?.title ?? ""),
    subtitle: subtitle !== (variant?.subtitle ?? ""),
    ctaLabel: ctaLabel !== (variant?.ctaLabel ?? ""),
    ctaUrl: ctaUrl !== (variant?.ctaUrl ?? ""),
    ctaText: ctaText !== (variant?.ctaText ?? ""),
    media: bannerUrl !== (variant?.bannerUrl ?? "") || videoUrl !== (variant?.videoUrl ?? ""),
    anon: bannerUrlAnon !== (variant?.bannerUrlAnon ?? ""),
    eyebrow: eyebrow !== (variant?.eyebrow ?? ""),
    timer: timer !== initialTimer,
  };
  const dirty = Object.values(changed).some(Boolean);
  useUnsavedGuard(dirty, navBypass);
  const isPending = createMutation.isPending || updateMutation.isPending;
  const canSubmit = name.trim() !== "" && (!isEdit || dirty) && !isPending;
  const mark = (c: boolean) => isEdit && c;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const data = {
      name,
      title: orNull(title),
      subtitle: orNull(subtitle),
      ctaLabel: orNull(ctaLabel),
      ctaUrl: orNull(ctaUrl),
      ctaText: orNull(ctaText),
      bannerUrl: orNull(bannerUrl),
      videoUrl: orNull(videoUrl),
      bannerUrlAnon: orNull(bannerUrlAnon),
      eyebrow: orNull(eyebrow),
      timerEndsAt: timer ? new Date(timer).toISOString() : null,
    };
    if (variant) {
      updateMutation.mutate({ id: variant.id, data });
    } else {
      createMutation.mutate({ data });
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={backToList}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Variants
        </button>
        <Button type="submit" disabled={!canSubmit}>
          {isPending ? "Saving…" : isEdit ? "Save" : "Create variant"}
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_minmax(320px,420px)]">
        <div className="grid gap-4">
          <div>
            <FieldHeader
              htmlFor="p-name"
              label={labelText("Name", mark(changed.name))}
              current={name.length}
              max={NAME_MAX}
            />
            <Input
              id="p-name"
              value={name}
              maxLength={NAME_MAX}
              className={dirtyFieldClass(mark(changed.name))}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <FieldHeader
              htmlFor="p-title"
              label={labelText("Title", mark(changed.title))}
              current={title.length}
              max={TITLE_MAX}
            />
            <Input
              id="p-title"
              value={title}
              maxLength={TITLE_MAX}
              className={dirtyFieldClass(mark(changed.title))}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <FieldHeader
              htmlFor="p-subtitle"
              label={labelText("Subtitle", mark(changed.subtitle))}
              current={subtitle.length}
              max={SUBTITLE_MAX}
            />
            <Textarea
              id="p-subtitle"
              value={subtitle}
              maxLength={SUBTITLE_MAX}
              rows={2}
              className={dirtyFieldClass(mark(changed.subtitle))}
              onChange={(e) => setSubtitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldHeader
                htmlFor="p-cta-label"
                label={labelText("CTA label", mark(changed.ctaLabel))}
                current={ctaLabel.length}
                max={CTA_LABEL_MAX}
              />
              <Input
                id="p-cta-label"
                value={ctaLabel}
                maxLength={CTA_LABEL_MAX}
                className={dirtyFieldClass(mark(changed.ctaLabel))}
                onChange={(e) => setCtaLabel(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="p-cta-url" className="mb-1 block text-sm font-medium">
                {labelText("CTA URL", mark(changed.ctaUrl))}
              </Label>
              <Input
                id="p-cta-url"
                value={ctaUrl}
                className={dirtyFieldClass(mark(changed.ctaUrl))}
                onChange={(e) => setCtaUrl(e.target.value)}
                placeholder="https://…"
              />
            </div>
          </div>
          <div>
            <FieldHeader
              htmlFor="p-cta-text"
              label={labelText("CTA text", mark(changed.ctaText))}
              current={ctaText.length}
              max={CTA_TEXT_MAX}
            />
            <Input
              id="p-cta-text"
              value={ctaText}
              maxLength={CTA_TEXT_MAX}
              className={dirtyFieldClass(mark(changed.ctaText))}
              onChange={(e) => setCtaText(e.target.value)}
              placeholder="Small text next to the button"
            />
          </div>

          <div>
            <Label className="mb-1 block text-sm font-medium">
              {labelText("Signed-in media (image or video)", mark(changed.media))}
            </Label>
            <HeroMediaField
              currentImageUrl={bannerUrl}
              currentVideoUrl={videoUrl}
              onImageChange={setBannerUrl}
              onVideoChange={setVideoUrl}
            />
          </div>
          <div>
            <Label className="mb-1 block text-sm font-medium">
              {labelText("Anonymous banner (image)", mark(changed.anon))}
            </Label>
            <ImageUploadField
              currentUrl={bannerUrlAnon}
              onChange={setBannerUrlAnon}
              emptyStateHint="Shown to logged-out visitors · PNG/JPG/WebP ≤5MB · drag & drop or click"
            />
          </div>

          <div>
            <Label htmlFor="p-eyebrow" className="mb-1 block text-sm font-medium">
              {labelText("Timer label", mark(changed.eyebrow))}
            </Label>
            <Input
              id="p-eyebrow"
              value={eyebrow}
              maxLength={80}
              placeholder="e.g. Album drops in"
              className={dirtyFieldClass(mark(changed.eyebrow))}
              onChange={(e) => setEyebrow(e.target.value)}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Shown above the countdown — only when a timer is set.
            </p>
          </div>

          <div>
            <Label htmlFor="p-timer" className="mb-1 block text-sm font-medium">
              {labelText("Countdown ends at", mark(changed.timer))}
            </Label>
            <Input
              id="p-timer"
              type="datetime-local"
              value={timer}
              className={dirtyFieldClass(mark(changed.timer))}
              onChange={(e) => setTimer(e.target.value)}
            />
          </div>
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Preview
          </p>
          <PromoPreview
            title={title}
            subtitle={subtitle}
            ctaLabel={ctaLabel}
            ctaText={ctaText}
            timer={timer}
            imageUrl={bannerUrl || bannerUrlAnon}
            videoUrl={videoUrl}
          />
        </div>
      </div>
    </form>
  );
}

// Mirrors the public hero: media background, text vertically centered & left.
// Timer slot above the CTA — countdown if a timer is set, else ctaText (the
// two are mutually exclusive, matching PromoHeroCountdown).
function PromoPreview({
  title,
  subtitle,
  ctaLabel,
  ctaText,
  timer,
  imageUrl,
  videoUrl,
}: {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaText: string;
  timer: string;
  imageUrl: string;
  videoUrl: string;
}) {
  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-zinc-900 text-white">
      {videoUrl ? (
        <video
          src={videoUrl}
          muted
          playsInline
          preload="metadata"
          className="absolute inset-0 size-full object-cover opacity-70"
        />
      ) : imageUrl ? (
        <img src={imageUrl} alt="" className="absolute inset-0 size-full object-cover opacity-70" />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-xs text-zinc-500">
          No media
        </div>
      )}

      <div className="absolute inset-0 flex flex-col justify-center gap-3 p-6">
        {title && <h3 className="text-2xl font-extrabold leading-tight">{title}</h3>}
        {subtitle && <p className="max-w-sm text-sm text-white/70">{subtitle}</p>}

        {timer ? (
          <PreviewCountdown timer={timer} />
        ) : ctaText ? (
          <p className="text-sm font-medium text-white/80">{ctaText}</p>
        ) : null}

        {ctaLabel && (
          <span className="inline-flex w-fit rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">
            {ctaLabel}
          </span>
        )}
      </div>
    </div>
  );
}

const pad = (n: number) => String(n).padStart(2, "0");

// Live ticking preview of the hero countdown. Date math runs in the effect /
// interval (never in render — React 19 purity rule); the first tick is
// deferred via queueMicrotask to avoid setState in the effect body.
function PreviewCountdown({ timer }: { timer: string }) {
  const [left, setLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    const endMs = new Date(timer).getTime();
    if (Number.isNaN(endMs)) {
      return;
    }
    const tick = () => {
      const diff = Math.max(0, endMs - Date.now());
      setLeft({
        d: Math.floor(diff / 86_400_000),
        h: Math.floor((diff / 3_600_000) % 24),
        m: Math.floor((diff / 60_000) % 60),
        s: Math.floor((diff / 1000) % 60),
      });
    };
    const id = window.setInterval(tick, 1000);
    queueMicrotask(tick);
    return () => window.clearInterval(id);
  }, [timer]);

  const v = left ?? { d: 0, h: 0, m: 0, s: 0 };
  return (
    <span className="font-mono text-sm font-bold tabular-nums text-white">
      {pad(v.d)} D {pad(v.h)} H {pad(v.m)} M {pad(v.s)} S
    </span>
  );
}
