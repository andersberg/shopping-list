import { Hono } from "hono";
import { MESSAGE } from "../constants";
import { grocery_item_router } from "./grocery-item";

export const api_router = new Hono()
	.route("/grocery-item", grocery_item_router)
	.get("/", (c) => {
		return c.json({
			message: MESSAGE,
		});
	});

export type ApiRouterType = typeof api_router;
