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

import { create_token_extraction_prompt } from "../../ai/grocery-input-parser/prompts/token-extraction-prompt.js";
import { grocery_ai_extraction_schema } from "../token-mapper.js";
import { AUDIT_TEST_CASES } from "./audit-test-cases.js";
import { compare_objects, PHASE1_FIELDS_TO_COMPARE } from "./diff-engine.js";

const MODEL_ID = "@cf/meta/llama-3.1-8b-instruct-fast";
const TIMEOUT_MS = 30000;

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
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${MODEL_ID}`;
  const prompt = create_token_extraction_prompt(testCase.input);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        // biome-ignore lint/style/useNamingConvention: HTTP header names must use this format
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const error_text = await response.text();
      return {
        test_id: testCase.id,
        status: "error",
        error_message: `HTTP ${response.status}: ${error_text}`,
      };
    }

    const ai_response = await response.json();

    // Extract response text from Cloudflare API response
    let response_text: string | undefined;
    if (
      ai_response &&
      typeof ai_response === "object" &&
      "result" in ai_response &&
      ai_response.result &&
      typeof ai_response.result === "object" &&
      "response" in ai_response.result &&
      typeof ai_response.result.response === "string"
    ) {
      response_text = ai_response.result.response;
    }

    if (!response_text) {
      return {
        test_id: testCase.id,
        status: "error",
        error_message: "No response text from AI",
      };
    }

    // Parse JSON - extract from markdown code block if present
    let json_text = response_text;
    const code_block_match = response_text.match(
      /```(?:json)?\s*\n?([\s\S]*?)\n?```/,
    );
    if (code_block_match) {
      json_text = code_block_match[1].trim();
    }

    let parsed_response: unknown;
    try {
      parsed_response = JSON.parse(json_text);
    } catch (e) {
      return {
        test_id: testCase.id,
        status: "error",
        error_message: `Failed to parse JSON: ${json_text.substring(0, 100)}`,
      };
    }

    // Validate schema
    const parse_result =
      grocery_ai_extraction_schema.safeParse(parsed_response);
    if (!parse_result.success) {
      return {
        test_id: testCase.id,
        status: "error",
        error_message: `Schema validation failed: ${parse_result.error.message}`,
      };
    }

    // Compare with expected
    const mismatches = compare_objects(
      testCase.expected as Record<string, unknown>,
      parse_result.data as Record<string, unknown>,
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

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ ${pass} passed`);
  console.log(`   ❌ ${fail} failed`);
  console.log(`   ⚠️  ${error} errors`);

  process.exit(fail + error > 0 ? 1 : 0);
}

main();
