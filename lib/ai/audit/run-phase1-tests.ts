#!/usr/bin/env tsx

/**
 * Simple Phase 1 AI extraction test runner.
 *
 * Calls Cloudflare AI API directly with test cases and reports results.
 *
 * Loads credentials from .env file (CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_WORKERS_AI_API_TOKEN)
 *
 * Usage:
 *   pnpm --filter lib audit:phase1
 *
 * Note: Run with --env-file flag to load .env variables:
 *   node --env-file=.env lib/api/audit/run-phase1-tests.ts
 */

import dedent from "dedent";
import {
	parse_ai_response,
	type FetcherResponse,
} from "../../ai/ai-response-parser.js";
import { create_token_extraction_prompt } from "../../parsers/ai/prompts/token-extraction-prompt.js";
import { grocery_ai_extraction_schema } from "../../parsers/ai/token-mapper.js";
import { AUDIT_TEST_CASES } from "../audit-test-cases.js";
import { compare_objects, PHASE1_FIELDS_TO_COMPARE } from "./diff-engine.js";

const MODEL_ID = "@cf/meta/llama-3.1-8b-instruct-fast";
const TIMEOUT_MS = 30000;

// API fetcher for use with parse_ai_response
const create_api_fetcher =
	(accountId: string, apiToken: string) =>
	async (prompt: string, jsonSchema?: object): Promise<FetcherResponse> => {
		const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${MODEL_ID}`;

		const response = await fetch(url, {
			method: "POST",
			headers: {
				// biome-ignore lint/style/useNamingConvention: HTTP header names must use this format
				Authorization: `Bearer ${apiToken}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				prompt,
				...(jsonSchema && {
					response_format: { type: "json_schema", json_schema: jsonSchema },
				}),
			}),
		});

		if (!response.ok) {
			const error_text = await response.text();
			return { error: `HTTP ${response.status}: ${error_text}` };
		}

		const ai_response = await response.json();

		// Handle API format: { result: { response: string | object } }
		if (
			ai_response &&
			typeof ai_response === "object" &&
			"result" in ai_response &&
			ai_response.result &&
			typeof ai_response.result === "object" &&
			"response" in ai_response.result
		) {
			const response_data = ai_response.result.response;

			// If response is already an object (JSON schema worked), stringify it
			if (typeof response_data === "object") {
				return { response: JSON.stringify(response_data) };
			}
			// If response is a string (fallback mode), use it directly
			if (typeof response_data === "string") {
				return { response: response_data };
			}
		}

		return { error: "No response text from AI" };
	};

interface TestResult {
	test_id: string;
	status: "pass" | "fail" | "error";
	mismatches?: Array<{ field: string; expected: unknown; actual: unknown }>;
	error_message?: string;
}

async function run_test(
	testCase: (typeof AUDIT_TEST_CASES)[0],
	accountId: string,
	apiToken: string,
): Promise<TestResult> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

	try {
		const result = await parse_ai_response({
			schema: grocery_ai_extraction_schema,
			prompt: create_token_extraction_prompt(testCase.input),
			fetcher: create_api_fetcher(accountId, apiToken),
		});

		clearTimeout(timeout);

		if (!result.success) {
			return {
				test_id: testCase.id,
				status: "error",
				error_message: result.error,
			};
		}

		// Compare with expected
		const mismatches = compare_objects(
			testCase.expected as Record<string, unknown>,
			result.data as Record<string, unknown>,
			PHASE1_FIELDS_TO_COMPARE,
		);

		return {
			test_id: testCase.id,
			status: mismatches.length === 0 ? "pass" : "fail",
			mismatches: mismatches.length > 0 ? mismatches : undefined,
		};
	} catch (error) {
		clearTimeout(timeout);
		return {
			test_id: testCase.id,
			status: "error",
			error_message: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

async function main() {
	const account_id = process.env.CLOUDFLARE_ACCOUNT_ID;
	const api_token = process.env.CLOUDFLARE_WORKERS_AI_API_TOKEN;

	if (!account_id || !api_token) {
		console.error("❌ Missing environment variables in .env file:");
		console.error("   CLOUDFLARE_ACCOUNT_ID");
		console.error("   CLOUDFLARE_WORKERS_AI_API_TOKEN");
		process.exit(1);
	}

	console.log("🧪 Running Phase 1 AI Extraction Tests");
	console.log(`📦 ${AUDIT_TEST_CASES.length} test cases\n`);

	const results: TestResult[] = [];

	for (const test_case of AUDIT_TEST_CASES) {
		process.stdout.write(`  ${test_case.id} ... `);
		const result = await run_test(test_case, account_id, api_token);
		results.push(result);

		if (result.status === "pass") {
			console.log("✅ pass");
		} else if (result.status === "fail") {
			console.log("❌ fail");
			if (result.mismatches) {
				for (const mismatch of result.mismatches) {
					console.log(
						`      ${mismatch.field}: expected ${JSON.stringify(mismatch.expected)}, got ${JSON.stringify(mismatch.actual)}`,
					);
				}
			}
		} else {
			console.log(`⚠️  error: ${result.error_message}`);
		}
	}

	// Summary
	const pass = results.filter((r) => r.status === "pass").length;
	const fail = results.filter((r) => r.status === "fail").length;
	const error = results.filter((r) => r.status === "error").length;

	const result = dedent(`\n
  📊 Summary:
    ✅ passed: ${pass}
    ⚠️ failed: ${fail}
    🚨 errors: ${error}
  `);

	console.log(result);

	process.exit(fail + error > 0 ? 1 : 0);
}

main();
