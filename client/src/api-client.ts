import { hc } from "hono/client";
import type { ApiRouterType } from "lib/Api";

export const api_client = hc<ApiRouterType>("/api");
