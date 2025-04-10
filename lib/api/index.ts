import { Hono } from "hono";
import { MESSAGE } from "../constants";
import { grocery_list_router } from "./grocery-list";

export const api_router = new Hono()
	.route("/grocery-list", grocery_list_router)
	.get("/", (c) => {
		return c.json({
			message: MESSAGE,
		});
	});

export type ApiRouterType = typeof api_router;
