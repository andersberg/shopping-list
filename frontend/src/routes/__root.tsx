import { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { Fragment } from "react/jsx-runtime";

const rootRouteWithContext = createRootRouteWithContext<{
  queryClient: QueryClient;
}>();

export const Route = rootRouteWithContext({
  component: () => (
    <Fragment>
      <main className="space-y-4 grow">
        <header>
          <h1 className="text-3xl font-bold">Shopping List</h1>
        </header>
        <Outlet />
      </main>
      <TanStackRouterDevtools position="top-right" />
      <ReactQueryDevtools position="bottom" buttonPosition="top-right" />
    </Fragment>
  ),
});
