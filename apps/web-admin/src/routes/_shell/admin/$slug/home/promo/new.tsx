import { createFileRoute } from "@tanstack/react-router";

import { PromoEditor } from "@/features/home/promo/promo-editor";

export const Route = createFileRoute("/_shell/admin/$slug/home/promo/new")({
  component: NewPromoPage,
});

function NewPromoPage() {
  const { slug } = Route.useParams();
  return <PromoEditor slug={slug} />;
}
