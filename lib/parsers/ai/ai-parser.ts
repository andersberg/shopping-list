import { z } from "zod";
import type { CloudflareEnvironmentBindings } from "../../cloudflare-environment-bindings";
import type { AiModels } from "@cloudflare/workers-types";
import {
	parse_ai_response,
	type FetcherResponse,
} from "../../ai/ai-response-parser";
import { map_tokens_to_grocery_item } from "./token-mapper";
import { create_token_extraction_prompt } from "./prompts/token-extraction-prompt";
import { GroceryParser } from "../shared/parser-interface";
import { create_error_grocery_item } from "../shared/parser-utils";
import type { GroceryItem } from "../../grocery-item";

// Schema for AI extraction (copied from token-mapper)
export const grocery_ai_extraction_schema = z.object({
	raw_text: z.string(),
	raw_item: z.string().nullable(),
	raw_qty: z.string().nullable(),
	raw_unit: z.string().nullable(),
	raw_brand: z.string().nullable(),
	raw_modifiers: z.array(z.string()),
	raw_offer: z.string().nullable(),
	raw_size_value: z.string().nullable(),
	raw_size_unit: z.string().nullable(),
	raw_comment: z.string().nullable(),
});

export type GroceryAiExtraction = z.infer<typeof grocery_ai_extraction_schema>;

// AI model name
const MODEL_ID = "@cf/meta/llama-3.1-8b-instruct-fast";

/**
 * AI Parser implementation that wraps existing AI extraction logic
 * and provides a unified interface for the two-phase parsing system.
 */
export class AiParser implements GroceryParser {
	readonly source = "ai" as const;

	constructor(private env: CloudflareEnvironmentBindings) {}

	async parse(input: string): Promise<GroceryItem> {
		// Create AI fetcher for Cloudflare Workers
		const fetcher = this.create_fetcher();

		// Extract tokens using AI
		const extraction_result = await parse_ai_response({
			schema: grocery_ai_extraction_schema,
			prompt: create_token_extraction_prompt(input),
			fetcher,
		});

		if (!extraction_result.success) {
			// Return error GroceryItem
			return create_error_grocery_item(extraction_result.error, input);
		}

		// Map AI extraction to standardized GroceryItem
		const grocery_item = map_tokens_to_grocery_item(extraction_result.data);

		// Set source to ai
		return {
			...grocery_item,
			source: "ai",
		};
	}

	/**
	 * Creates a fetcher function compatible with parse_ai_response
	 */
	private create_fetcher() {
		return async (
			prompt: string,
			jsonSchema?: object,
		): Promise<FetcherResponse> => {
			try {
				const response = await this.env.AI.run(MODEL_ID as keyof AiModels, {
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
			} catch (error) {
				return {
					error: error instanceof Error ? error.message : "Unknown error",
				};
			}
		};
	}
}
