import { z } from "zod";

export type FetcherResponse = { response: string } | { error: string };

/**
 * Parses AI response using JSON schema with Zod validation.
 * Pure utility function - caller handles failures appropriately.
 */
export async function parse_ai_response<T>({
	schema,
	prompt,
	fetcher,
}: {
	schema: z.ZodSchema<T>;
	prompt: string;
	fetcher: (prompt: string, jsonSchema?: object) => Promise<FetcherResponse>;
}): Promise<
	| { success: true; data: T }
	| { success: false; error: string; details?: unknown }
> {
	const jsonSchema = z.toJSONSchema(schema);

	try {
		const response = await fetcher(prompt, jsonSchema);

		if ("error" in response) {
			return { success: false, error: response.error };
		}

		// Parse and validate JSON response
		const parsed = JSON.parse(response.response);
		const result = schema.safeParse(parsed);

		if (!result.success) {
			return {
				success: false,
				error: `Schema validation failed: ${result.error.message}`,
				details: result.error.format(),
			};
		}

		return { success: true, data: result.data };
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
			details: error instanceof Error ? error.stack : undefined,
		};
	}
}
