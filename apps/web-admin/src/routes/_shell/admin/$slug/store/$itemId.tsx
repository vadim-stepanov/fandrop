import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { useListStoreItems } from "@/api/generated/store/store";
import { StoreEditor } from "@/features/store/store-editor";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_shell/admin/$slug/store/$itemId")({
  component: EditStoreItemPage,
});

function EditStoreItemPage() {
  const { slug, itemId } = Route.useParams();
  const navigate = useNavigate();
  const { data: items, isLoading } = useListStoreItems();
  const item = items?.find((i) => i.id === itemId);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (!item) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive">Item not found.</p>
        <Button
          variant="outline"
          onClick={() => void navigate({ to: "/admin/$slug/store", params: { slug } })}
        >
          Back to store
        </Button>
      </div>
    );
  }
  return <StoreEditor slug={slug} item={item} />;
}
