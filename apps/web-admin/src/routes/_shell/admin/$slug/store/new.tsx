import { createFileRoute } from "@tanstack/react-router";

import { StoreEditor } from "@/features/store/store-editor";

export const Route = createFileRoute("/_shell/admin/$slug/store/new")({
  component: NewStoreItemPage,
});

function NewStoreItemPage() {
  const { slug } = Route.useParams();
  return <StoreEditor slug={slug} />;
}
