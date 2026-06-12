import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { useListPromoVariants } from "@/api/generated/promo/promo";
import { PromoEditor } from "@/features/home/promo/promo-editor";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_shell/admin/$slug/home/promo/$variantId")({
  component: EditPromoPage,
});

function EditPromoPage() {
  const { slug, variantId } = Route.useParams();
  const navigate = useNavigate();
  const { data: variants, isLoading } = useListPromoVariants();
  const variant = variants?.find((v) => v.id === variantId);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (!variant) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive">Variant not found.</p>
        <Button
          variant="outline"
          onClick={() => void navigate({ to: "/admin/$slug/home/promo", params: { slug } })}
        >
          Back to variants
        </Button>
      </div>
    );
  }
  return <PromoEditor slug={slug} variant={variant} />;
}
