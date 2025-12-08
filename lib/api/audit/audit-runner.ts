import type { GroceryAiExtraction } from '../token-mapper';
import { compare_objects, PHASE1_FIELDS_TO_COMPARE } from './diff-engine';
import { print_console_report, type AuditResult, type AuditReport } from './console-reporter';
import { AUDIT_TEST_CASES, type TestCase } from './audit-test-cases';

export interface AuditOptions {
  api_url: string;
  verbose: boolean;
  filter?: string;
  timeout_ms: number;
}

export async function run_audit(options: AuditOptions): Promise<AuditReport> {
  // 1. Check server availability
  const server_ready = await check_server_health(options.api_url);
  if (!server_ready) {
    const report: AuditReport = {
      status: 'server_unavailable',
      api_url: options.api_url,
      total_tests: 0,
      results: [],
      summary: { pass: 0, mismatch: 0, http_error: 0 },
    };
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
  const report = generate_report(options.api_url, results);
  print_console_report(report, options.verbose);

  return report;
}

async function check_server_health(api_url: string): Promise<boolean> {
  try {
    // Try to hit the base API endpoint
    const base_url = api_url.replace('/api/parse-tokens', '/api').replace('/api/parse', '/api');
    const response = await fetch(base_url, { method: 'GET' });
    return response.ok;
  } catch (error) {
    return false;
  }
}

function filter_test_cases(test_cases: TestCase[], filter?: string): TestCase[] {
  if (!filter) return test_cases;

  // Simple glob-style pattern matching
  const regex = new RegExp(
    '^' + filter.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
  );

  return test_cases.filter(tc => regex.test(tc.id));
}

async function test_phase1(
  test_case: TestCase,
  options: AuditOptions
): Promise<AuditResult> {
  // Call /parse-tokens endpoint
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeout_ms);

  try {
    const response = await fetch(`${options.api_url}/parse-tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: test_case.input }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    // Handle HTTP errors non-blocking
    if (!response.ok) {
      return {
        test_case_id: test_case.id,
        description: test_case.description,
        status: 'http_error',
        http_status: response.status,
        mismatches: [],
      };
    }

    const actual: GroceryAiExtraction = await response.json();

    // Compare with inline expected values
    const mismatches = compare_objects(
      test_case.expected as Record<string, unknown>,
      actual as Record<string, unknown>,
      PHASE1_FIELDS_TO_COMPARE
    );

    return {
      test_case_id: test_case.id,
      description: test_case.description,
      status: mismatches.length > 0 ? 'mismatch' : 'success',
      actual,
      expected: test_case.expected as Record<string, unknown>,
      mismatches,
    };
  } catch (error) {
    clearTimeout(timeout);

    if (error instanceof Error && error.name === 'AbortError') {
      return {
        test_case_id: test_case.id,
        description: test_case.description,
        status: 'http_error',
        http_status: 408, // Request Timeout
        mismatches: [],
      };
    }

    return {
      test_case_id: test_case.id,
      description: test_case.description,
      status: 'http_error',
      http_status: 0,
      mismatches: [],
    };
  }
}

function generate_report(api_url: string, results: AuditResult[]): AuditReport {
  const summary = {
    pass: results.filter(r => r.status === 'success').length,
    mismatch: results.filter(r => r.status === 'mismatch').length,
    http_error: results.filter(r => r.status === 'http_error').length,
  };

  const has_issues = summary.mismatch > 0 || summary.http_error > 0;

  return {
    status: has_issues ? 'has_issues' : 'success',
    api_url,
    total_tests: results.length,
    results,
    summary,
  };
}
