import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";

import "./index.css";
import { restoreSession } from "@/lib/auth";
import { routeTree } from "./routeTree.gen";

const queryClient = new QueryClient();
const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Rehydrate auth from the refresh cookie BEFORE rendering the app, so route
// guards see the final status. Show a splash meanwhile (restoreSession rides
// out a transient api outage), so a server restart never flashes the login
// screen on a still-valid session.
async function bootstrap(): Promise<void> {
  const root = createRoot(document.getElementById("root")!);
  root.render(
    <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
      Loading…
    </div>,
  );
  await restoreSession();
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
      <Toaster
        richColors
        closeButton
        expand
        position="top-right"
        visibleToasts={5}
        duration={3000}
      />
    </StrictMode>,
  );
}

void bootstrap();
