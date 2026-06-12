import { useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";

import {
  getGetArtistSettingsQueryKey,
  useUpdateArtistSettings,
} from "@/api/generated/artist-settings/artist-settings";
import type { ArtistSettingsResponseDto } from "@/api/generated/model";
import { dirtyFieldClass, labelText, labelTextWithHint } from "@/components/field-label";
import { ImageUploadField } from "@/components/image-upload-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUnsavedGuard } from "@/lib/use-unsaved-guard";

const NAME_MAX = 120;

export function BrandingEditor({ settings }: { settings: ArtistSettingsResponseDto }) {
  const queryClient = useQueryClient();
  const mutation = useUpdateArtistSettings({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getGetArtistSettingsQueryKey() });
        toast.success("Saved");
      },
      onError: () => toast.error("Failed to save"),
    },
  });

  const [name, setName] = useState(settings.name);
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl ?? "");
  const [bonus, setBonus] = useState(String(settings.signupBonusPoints));

  const changed = {
    name: name !== settings.name,
    logoUrl: logoUrl !== (settings.logoUrl ?? ""),
    bonus: bonus !== String(settings.signupBonusPoints),
  };
  const dirty = Object.values(changed).some(Boolean);
  useUnsavedGuard(dirty);
  const bonusNum = Number(bonus);
  const valid = name.trim() !== "" && Number.isInteger(bonusNum) && bonusNum >= 0;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!dirty || !valid) {
      return;
    }
    mutation.mutate({
      data: { name: name.trim(), logoUrl: logoUrl.trim() || null, signupBonusPoints: bonusNum },
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Branding
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="a-name" className="mb-1">
            {labelText("Name", changed.name)}
          </Label>
          <Input
            id="a-name"
            value={name}
            maxLength={NAME_MAX}
            className={dirtyFieldClass(changed.name)}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <Label className="mb-1">{labelText("Logo", changed.logoUrl)}</Label>
          <ImageUploadField
            currentUrl={logoUrl}
            onChange={setLogoUrl}
            labelDimensions="Recommended 400×400"
          />
        </div>
        <div>
          <Label htmlFor="a-bonus" className="mb-1">
            {labelTextWithHint(
              "Welcome bonus",
              changed.bonus,
              "Points granted to a fan on first join. (Awarding ships with the membership-bonuses feature.)",
            )}
          </Label>
          <Input
            id="a-bonus"
            type="number"
            min={0}
            value={bonus}
            className={dirtyFieldClass(changed.bonus)}
            onChange={(e) => setBonus(e.target.value)}
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button type="submit" disabled={!dirty || !valid || mutation.isPending}>
          {mutation.isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}
