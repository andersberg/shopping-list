import { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { Fragment } from "react/jsx-runtime";

const isDev = import.meta.env.DEV;

const rootRouteWithContext = createRootRouteWithContext<{
  queryClient: QueryClient;
}>();

export const Route = rootRouteWithContext({
  component: () => {
    return (
      <Fragment>
        {isDev && (
          <Fragment>
            <TanStackRouterDevtools position="top-right" />
            <ReactQueryDevtools position="bottom" buttonPosition="top-left" />
          </Fragment>
        )}
        <Outlet />
      </Fragment>
    );
  },
});
