import { type ApiRoutes } from "@server/app";
import { hc } from "hono/client";

const client = hc<ApiRoutes>(`http://localhost:${Bun.env.BACKEND_PORT}`);

export const ListsApi = client.lists;
export const ItemsApi = client.items;
