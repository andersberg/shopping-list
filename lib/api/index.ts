import { Hono } from "hono";
import { MESSAGE } from "../constants";
import { grocery_list_router } from "./grocery-list";
import { zValidator } from "@hono/zod-validator";
import { object, string, z } from "zod/v4";
import { CloudflareEnvironmentBindings } from "../cloudflare-environment-bindings";
import type { AiModels } from "@cloudflare/workers-types";
import { create_token_extraction_prompt } from "../ai/grocery-input-parser/prompts/token-extraction-prompt";
import {
	GroceryAiExtractionSchema,
	map_tokens_to_grocery_item,
} from "./token-mapper";
import { parse_grocery_line } from "../grocery-input-parser/manual-parser";
import { STORE_NAMES } from "../ai/grocery-input-parser/store-names";
import { BRAND_NAMES } from "../ai/grocery-input-parser/brand-names";
import { CATEGORY_NAMES } from "../ai/grocery-input-parser/category-names";
import { QUANTITY_UNITS } from "../ai/grocery-input-parser/quantity-units";
import { SIZE_UNITS } from "../ai/grocery-input-parser/size-units";

// const MODEL_NAME: keyof AiModels = "@cf/meta/llama-3.1-8b-instruct-fp8";
const MODEL_NAME: keyof AiModels =
	"@cf/meta/llama-3.1-8b-instruct-fast" as keyof AiModels;

const STATUS = ["ok", "unparsed"] as const;
const CURRENCY = ["SEK"];

const GroceryItemSchema = z.strictObject({
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

const GroceryAiExtractionSchema_as_json_schema = z.toJSONSchema(
	GroceryAiExtractionSchema,
);

const loose_GroceryItemSchema = z.looseObject({
	...GroceryItemSchema.shape,
	category: z.string().nullable(),
	quantity_unit: z.string().min(1).nullable(),
	size_unit: z.string().min(1).nullable(),
	unit_normalized: z.string().min(1).nullable(),
	total_quantity_unit: z.string().min(1).nullable(),
	store_normalized: z.string().min(1).nullable(),
	offer_currency: z.string().min(1).nullable(),
	status: z.enum(STATUS),
});

const GroceryItemSchema_as_json_schema = z.toJSONSchema(
	loose_GroceryItemSchema,
);

function create_prompt(input: string) {
	return create_token_extraction_prompt(input);
}

// console.log("messages_base", messages_base);

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

			// Try manual parser first
			const manual_result = parse_grocery_line(input);
			if (manual_result.status === "ok") {
				console.log("Manual parser success:", manual_result);
				return c.json(manual_result);
			}
			console.log(
				"Manual parser partial/failed, falling back to AI. Status:",
				manual_result.status,
			);

			const ai_response = await c.env.AI.run(MODEL_NAME, {
				prompt: create_prompt(input),
				// @ts-ignore - response_format is available in the AI binding but types might be outdated
				response_format: {
					type: "json_schema",
					schema: GroceryAiExtractionSchema_as_json_schema,
				},
			});

			console.log("Raw AI response:", JSON.stringify(ai_response, null, 2));
			console.log("AI response type:", typeof ai_response);

			// Cloudflare Workers AI returns { response: string } for text models
			let response_text;
			if (typeof ai_response === "string") {
				response_text = ai_response;
			} else if (
				ai_response &&
				typeof ai_response === "object" &&
				"response" in ai_response
			) {
				response_text = ai_response.response;
			} else {
				console.error("Unexpected AI response format:", ai_response);
				return c.json({
					status: "parse_error",
					raw_text: input,
					error: "Unexpected AI response format",
				});
			}

			// Try to parse response text as JSON
			let parsed_response;
			try {
				parsed_response = JSON.parse(response_text);
			} catch (e) {
				console.error("Failed to parse AI response as JSON:", e);
				console.error("Response text was:", response_text);
				return c.json({
					status: "parse_error",
					raw_text: input,
					error: "AI response is not valid JSON",
					raw_response: response_text,
				});
			}

			// Validate AI response
			const parse_result = GroceryAiExtractionSchema.safeParse(parsed_response);
			if (!parse_result.success) {
				console.error("AI response validation failed:", parse_result.error);
				console.error("AI response was:", parsed_response);
				return c.json({
					status: "parse_error",
					raw_text: input,
					error: "AI response validation failed",
					details: parse_result.error.format(),
				});
			}

			// Map tokens to grocery item
			const grocery_item = map_tokens_to_grocery_item(parse_result.data);

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

			const ai_response = await c.env.AI.run(MODEL_NAME, {
				prompt: create_prompt(input),
			});

			console.log("Raw AI response:", JSON.stringify(ai_response, null, 2));

			// Cloudflare Workers AI returns { response: string } for text models
			let response_text;
			if (typeof ai_response === "string") {
				response_text = ai_response;
			} else if (
				ai_response &&
				typeof ai_response === "object" &&
				"response" in ai_response
			) {
				response_text = ai_response.response;
			} else {
				console.error("Unexpected AI response format:", ai_response);
				return c.json(
					{
						status: "parse_error",
						error: "Unexpected AI response format",
					},
					500,
				);
			}

			// Try to parse response text as JSON
			let parsed_response;
			try {
				parsed_response = JSON.parse(response_text);
			} catch (e) {
				console.error("Failed to parse AI response as JSON:", e);
				console.error("Response text was:", response_text);
				return c.json(
					{
						status: "parse_error",
						error: "AI response is not valid JSON",
						raw_response: response_text,
					},
					500,
				);
			}

			// Validate AI response
			const parse_result = GroceryAiExtractionSchema.safeParse(parsed_response);
			if (!parse_result.success) {
				console.error("AI response validation failed:", parse_result.error);
				console.error("AI response was:", parsed_response);
				return c.json(
					{
						status: "parse_error",
						error: "AI response validation failed",
						details: parse_result.error.format(),
					},
					500,
				);
			}

			// Return only Phase 1 tokens (no Phase 2 mapping)
			return c.json(parse_result.data);
		},
	)
	.get("/", (c) => {
		return c.json({
			message: MESSAGE,
		});
	});

export type ApiRouterType = typeof api_router;
