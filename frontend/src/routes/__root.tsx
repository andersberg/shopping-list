import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

export const Route = createRootRoute({
  component: () => (
    <main>
      <main className="space-y-4 grow">
        <header>
          <h1 className="text-3xl font-bold">Shopping List</h1>
        </header>
        <Outlet />
      </main>
      <TanStackRouterDevtools position="top-right" />
    </main>
  ),
});
