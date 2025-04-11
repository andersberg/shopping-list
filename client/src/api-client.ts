import { hc } from "hono/client";
import type { ApiRouterType } from "lib/Api";
import type { GroceryListRouter } from "lib/api/grocery-list";

export const api_client = hc<ApiRouterType>("/api");

export const grocery_list_client = hc<GroceryListRouter>("/api/grocery-list");
