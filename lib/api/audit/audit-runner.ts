import { create_token_extraction_prompt } from "../../ai/grocery-input-parser/prompts/token-extraction-prompt.js";
import type { GroceryAiExtraction } from "../token-mapper";
import { grocery_ai_extraction_schema } from "../token-mapper";
import { AUDIT_TEST_CASES, type TestCase } from "./audit-test-cases";
import {
  type AuditReport,
  type AuditResult,
  print_console_report,
} from "./console-reporter";
import { compare_objects, PHASE1_FIELDS_TO_COMPARE } from "./diff-engine";

export interface AuditOptions {
  cloudflare_account_id: string;
  cloudflare_api_token: string;
  model_id?: string;
  verbose: boolean;
  filter?: string;
  timeout_ms: number;
}

const DEFAULT_MODEL_ID = "@cf/meta/llama-3.1-8b-instruct-fast";

export async function run_audit(options: AuditOptions): Promise<AuditReport> {
  // 1. Validate credentials
  if (!options.cloudflare_account_id || !options.cloudflare_api_token) {
    const report: AuditReport = {
      status: "server_unavailable",
      api_url: "N/A - Direct API",
      total_tests: 0,
      results: [],
      summary: { pass: 0, mismatch: 0, http_error: 0 },
    };
    console.error(
      "Error: Missing Cloudflare credentials. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN environment variables.",
    );
    print_console_report(report, options.verbose);
    return report;
  }

  // 2. Load and filter test cases
  const test_cases = filter_test_cases(AUDIT_TEST_CASES, options.filter);
  const results: AuditResult[] = [];

  // 3. For each test case
  for (const test_case of test_cases) {
    const result = await test_phase1(test_case, options);
    results.push(result);
  }

  // 4. Generate and display report
  const report = generate_report("Direct Cloudflare AI API", results);
  print_console_report(report, options.verbose);

  return report;
}

function filter_test_cases(testCases: TestCase[], filter?: string): TestCase[] {
  if (!filter) return testCases;

  // Simple glob-style pattern matching
  const regex = new RegExp(
    `^${filter.replace(/\*/g, ".*").replace(/\?/g, ".")}$`,
  );

  return testCases.filter((tc) => regex.test(tc.id));
}

async function test_phase1(
  testCase: TestCase,
  options: AuditOptions,
): Promise<AuditResult> {
  const model_id = options.model_id || DEFAULT_MODEL_ID;
  const url = `https://api.cloudflare.com/client/v4/accounts/${options.cloudflare_account_id}/ai/run/${model_id}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeout_ms);

  try {
    const prompt = create_token_extraction_prompt(testCase.input);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${options.cloudflare_api_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    // Handle HTTP errors
    if (!response.ok) {
      const error_text = await response.text();
      console.error(
        `HTTP ${response.status} for test ${testCase.id}:`,
        error_text,
      );
      return {
        test_case_id: testCase.id,
        description: testCase.description,
        status: "http_error",
        http_status: response.status,
        mismatches: [],
      };
    }

    const ai_response = await response.json();

    // Extract response text from Cloudflare AI response
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
    } else if (typeof ai_response === "string") {
      response_text = ai_response;
    } else {
      console.error("Unexpected AI response format:", ai_response);
      return {
        test_case_id: testCase.id,
        description: testCase.description,
        status: "http_error",
        http_status: 0,
        mismatches: [],
      };
    }

    if (!response_text) {
      return {
        test_case_id: testCase.id,
        description: testCase.description,
        status: "http_error",
        http_status: 0,
        mismatches: [],
      };
    }

    // Parse JSON response
    let parsed_response: unknown;
    try {
      parsed_response = JSON.parse(response_text);
    } catch (e) {
      console.error(
        `Failed to parse AI response for test ${testCase.id}:`,
        response_text,
      );
      return {
        test_case_id: testCase.id,
        description: testCase.description,
        status: "http_error",
        http_status: 0,
        mismatches: [],
      };
    }

    // Validate response
    const parse_result =
      grocery_ai_extraction_schema.safeParse(parsed_response);
    if (!parse_result.success) {
      console.error(
        `AI response validation failed for test ${testCase.id}:`,
        parse_result.error,
      );
      return {
        test_case_id: testCase.id,
        description: testCase.description,
        status: "http_error",
        http_status: 0,
        mismatches: [],
      };
    }

    const actual: GroceryAiExtraction = parse_result.data;

    // Compare with expected values
    const mismatches = compare_objects(
      testCase.expected as Record<string, unknown>,
      actual as Record<string, unknown>,
      PHASE1_FIELDS_TO_COMPARE,
    );

    return {
      test_case_id: testCase.id,
      description: testCase.description,
      status: mismatches.length > 0 ? "mismatch" : "success",
      actual,
      expected: testCase.expected as Record<string, unknown>,
      mismatches,
    };
  } catch (error) {
    clearTimeout(timeout);

    if (error instanceof Error && error.name === "AbortError") {
      return {
        test_case_id: testCase.id,
        description: testCase.description,
        status: "http_error",
        http_status: 408, // Request Timeout
        mismatches: [],
      };
    }

    console.error(`Error testing ${testCase.id}:`, error);
    return {
      test_case_id: testCase.id,
      description: testCase.description,
      status: "http_error",
      http_status: 0,
      mismatches: [],
    };
  }
}

function generate_report(apiUrl: string, results: AuditResult[]): AuditReport {
  const summary = {
    pass: results.filter((r) => r.status === "success").length,
    mismatch: results.filter((r) => r.status === "mismatch").length,
    http_error: results.filter((r) => r.status === "http_error").length,
  };

  const has_issues = summary.mismatch > 0 || summary.http_error > 0;

  return {
    status: has_issues ? "has_issues" : "success",
    api_url: apiUrl,
    total_tests: results.length,
    results,
    summary,
  };
}
