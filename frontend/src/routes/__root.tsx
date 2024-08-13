import { MainLayout } from "@/components/MainLayout";
import { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

const isDev = import.meta.env.DEV;

const rootRouteWithContext = createRootRouteWithContext<{
  queryClient: QueryClient;
}>();

export const Route = rootRouteWithContext({
  component: () => {
    return (
      <div className="flex flex-col bg-white h-svh">
        {isDev && (
          <div className="h-20 bg-red-200">
            <TanStackRouterDevtools position="top-right" />
            <ReactQueryDevtools position="bottom" buttonPosition="top-left" />
          </div>
        )}

        <MainLayout className="grow">
          <Outlet />
        </MainLayout>
      </div>
    );
  },
});
