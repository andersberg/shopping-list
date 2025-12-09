import type { AiModels } from "@cloudflare/workers-types";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { object, string, z } from "zod/v4";
import { create_token_extraction_prompt } from "../ai/grocery-input-parser/prompts/token-extraction-prompt.js";
import {
	parse_ai_response,
	type FetcherResponse,
} from "../ai/ai-response-parser.js";
import type { CloudflareEnvironmentBindings } from "../cloudflare-environment-bindings";
import {
	CATEGORY_NAMES,
	MESSAGE,
	QUANTITY_UNITS,
	SIZE_UNITS,
	STORE_NAMES,
} from "../constants";
import { grocery_list_router } from "./grocery-list";
import {
	grocery_ai_extraction_schema,
	map_tokens_to_grocery_item,
} from "./token-mapper";

// const MODEL_NAME: keyof AiModels = "@cf/meta/llama-3.1-8b-instruct-fp8";
const MODEL_NAME: keyof AiModels =
	"@cf/meta/llama-3.1-8b-instruct-fast" as keyof AiModels;

const STATUS = ["ok", "unparsed"] as const;
const CURRENCY = ["SEK"];

const GROCERY_ITEM_SCHEMA = z.strictObject({
	item: z.string().nullable(),
	category: z.enum(CATEGORY_NAMES).nullable(),
	quantity: z.number().min(0),
	quantity_unit: z.enum(QUANTITY_UNITS).nullable(),
	size_value: z.number().min(0),
	size_unit: z.enum(SIZE_UNITS).nullable(),
	brand: z.string().nullable(),
	organic: z.boolean(),
	comment: z.string().nullable(),
	unit_normalized: z.enum(SIZE_UNITS).nullable(),
	total_quantity_value: z.number().min(0),
	total_quantity_unit: z.enum(SIZE_UNITS).nullable(),
	store_normalized: z.enum(STORE_NAMES).nullable(),
	store_raw: z.string().nullable(),
	offer_quantity: z.number().min(0),
	offer_total_price_value: z.number().min(0),
	offer_currency: z.enum(CURRENCY).nullable(),
	offer_unit_price_value: z.number().min(0),
	status: z.enum(STATUS),
	error: z.string().nullable(),
});

function create_prompt(input: string) {
	return create_token_extraction_prompt(input);
}

// Workers AI fetcher for use with parse_ai_response
const create_workers_ai_fetcher =
	(env: CloudflareEnvironmentBindings) =>
	async (prompt: string, jsonSchema?: object): Promise<FetcherResponse> => {
		const response = await env.AI.run(MODEL_NAME, {
			prompt,
			...(jsonSchema && {
				response_format: { type: "json_schema", json_schema: jsonSchema },
			}),
		});

		// Handle Workers AI format: { response: string | object }
		if (typeof response === "string") {
			return { response };
		} else if (
			response &&
			typeof response === "object" &&
			"response" in response
		) {
			const response_data = response.response;

			// If response is already an object (JSON schema worked), stringify it
			if (typeof response_data === "object") {
				return { response: JSON.stringify(response_data) };
			}
			// If response is a string (fallback mode), use it directly
			if (typeof response_data === "string") {
				return { response: response_data };
			}
		}

		return { error: "Unexpected AI response format" };
	};

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

			const result = await parse_ai_response({
				schema: grocery_ai_extraction_schema,
				prompt: create_prompt(input),
				fetcher: create_workers_ai_fetcher(c.env),
			});

			if (!result.success) {
				return c.json({
					status: "parse_error",
					raw_text: input,
					error: result.error,
					details: result.details,
				});
			}

			const grocery_item = map_tokens_to_grocery_item(result.data);
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

			const result = await parse_ai_response({
				schema: grocery_ai_extraction_schema,
				prompt: create_prompt(input),
				fetcher: create_workers_ai_fetcher(c.env),
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
