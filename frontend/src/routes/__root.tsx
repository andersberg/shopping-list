import { shoppingListQueryClient } from "@/lib/resources";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

export const Route = createRootRoute({
  component: () => (
    <QueryClientProvider client={shoppingListQueryClient}>
      <main className="space-y-4 grow">
        <header>
          <h1 className="text-3xl font-bold">Shopping List</h1>
        </header>
        <Outlet />
      </main>
      <TanStackRouterDevtools position="top-right" />
      <ReactQueryDevtools position="bottom" buttonPosition="top-right" />
    </QueryClientProvider>
  ),
});
