import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { object, string, z } from "zod/v4";
import { parse_ai_response } from "../ai/ai-response-parser.js";
import type { CloudflareEnvironmentBindings } from "../cloudflare-environment-bindings";
import {
	CATEGORY_NAMES,
	STORE_NAMES,
	SIZE_UNITS,
	CONTAINER_UNITS,
} from "../domain/constants";
import { MESSAGE } from "../constants";
import { grocery_list_router } from "./grocery-list";
import { AiParser } from "../parsers";
import { grocery_ai_extraction_schema } from "../parsers/ai/token-mapper";
import { create_token_extraction_prompt } from "../parsers/ai/prompts/token-extraction-prompt";

const STATUS = ["ok", "unparsed"] as const;
const CURRENCY = ["SEK"];

export const api_router = new Hono<{
	Bindings: CloudflareEnvironmentBindings;
}>()
	.route("/grocery-list", grocery_list_router)
	.post(
		"/parse",
		zValidator(
			"json",
			object({
				input: string().nonempty(),
			}),
		),
		async (c) => {
			const { input } = await c.req.json();
			console.log("/parse-cf-ai", input);

			// Use the new AiParser with unified interface
			const aiParser = new AiParser(c.env);
			const grocery_item = await aiParser.parse(input);

			return c.json(grocery_item);
		},
	)
	.post(
		"/parse-tokens",
		zValidator(
			"json",
			object({
				input: string().nonempty(),
			}),
		),
		async (c) => {
			const { input } = await c.req.json();
			console.log("/parse-tokens", input);

			// Use the AiParser to get raw tokens (Phase 1 only)
			const aiParser = new AiParser(c.env);

			// For tokens endpoint, we need to access the raw AI extraction
			// We'll use the internal parse_ai_response directly
			const fetcher = aiParser["create_fetcher"]();
			const result = await parse_ai_response({
				schema: grocery_ai_extraction_schema,
				prompt: create_token_extraction_prompt(input),
				fetcher,
			});

			if (!result.success) {
				return c.json(
					{
						status: "parse_error",
						error: result.error,
						details: result.details,
					},
					500,
				);
			}

			// Return only Phase 1 tokens (no Phase 2 mapping)
			return c.json(result.data);
		},
	)
	.get("/", (c) => {
		return c.json({
			message: MESSAGE,
		});
	});

export type ApiRouterType = typeof api_router;
