import pc from "picocolors";
import type { FieldMismatch } from "./diff-engine";

export const SYMBOLS = {
	pass: "✓",
	fail: "✗",
	warning: "⚠",
	skip: "⊖",
	http_error: "⊗",
};

export interface AuditResult {
	test_case_id: string;
	description: string;
	status: "success" | "mismatch" | "http_error";
	http_status?: number;
	actual?: unknown;
	expected?: Record<string, unknown>;
	mismatches?: FieldMismatch[];
}

export interface AuditReport {
	status: "success" | "server_unavailable" | "has_issues";
	api_url: string;
	total_tests: number;
	results: AuditResult[];
	summary: {
		pass: number;
		mismatch: number;
		http_error: number;
	};
}

export function print_console_report(
	report: AuditReport,
	verbose: boolean = false,
): void {
	// Header
	console.log(pc.bold("═".repeat(80)));
	console.log(pc.bold(pc.cyan("  PHASE 1 AI EXTRACTION AUDIT REPORT")));
	console.log(pc.bold("═".repeat(80)));
	console.log();

	if (report.status === "server_unavailable") {
		console.log(
			pc.red(`${SYMBOLS.fail} Server not available at ${report.api_url}`),
		);
		console.log(pc.dim("Make sure the server is running: pnpm server:dev"));
		return;
	}

	// Summary info
	console.log(`Server: ${report.api_url} ${pc.green(`${SYMBOLS.pass} Ready`)}`);
	console.log(`Test Cases: ${report.total_tests} total`);
	console.log();

	// Divider
	console.log(pc.dim("─".repeat(80)));
	console.log();

	// Individual test results
	for (const [idx, result] of report.results.entries()) {
		print_test_result(idx + 1, report.total_tests, result, verbose);
	}

	// Divider
	console.log(pc.dim("─".repeat(80)));
	console.log();

	// Final summary
	print_final_summary(report);
}

function print_test_result(
	index: number,
	total: number,
	result: AuditResult,
	verbose: boolean,
): void {
	const symbol = get_status_symbol(result.status);
	const color = get_status_color(result.status);

	console.log(
		`${color(`[${index}/${total}] ${symbol} ${result.description}`)}`,
	);
	console.log(
		pc.dim(
			`  Input: "${
				(result.expected as any)?.raw_text ||
				(result.actual as any)?.raw_text ||
				"unknown"
			}"`,
		),
	);

	const status_text = get_status_text(result.status, result);
	console.log(`  Status: ${color(status_text)}`);

	// Print mismatches with indentation
	if (result.mismatches && result.mismatches.length > 0) {
		for (const [idx, mismatch] of result.mismatches.entries()) {
			const is_last = idx === result.mismatches.length - 1;
			const prefix = is_last ? "└─" : "├─";

			console.log(
				`    ${pc.dim(prefix)} ${pc.cyan(`Field: ${mismatch.field}`)}`,
			);
			console.log(
				`    ${pc.dim("│")}  ${pc.green("Expected:")} ${format_value(
					mismatch.expected,
				)}`,
			);
			console.log(
				`    ${pc.dim("│")}  ${pc.red("Actual:  ")} ${format_value(
					mismatch.actual,
				)}`,
			);

			if (verbose && !is_last) {
				console.log(`    ${pc.dim("│")}`);
			}
		}
	}

	console.log();
}

function print_final_summary(report: AuditReport): void {
	console.log(pc.bold("SUMMARY:"));
	console.log(`  Total Tests:      ${report.total_tests}`);
	console.log();

	const { pass, mismatch, http_error } = report.summary;

	console.log(
		`  ${pc.green(SYMBOLS.pass)} Pass:           ${pass}  (${percentage(
			pass,
			report.total_tests,
		)})`,
	);
	console.log(
		`  ${pc.red(SYMBOLS.fail)} Mismatch:       ${mismatch}  (${percentage(
			mismatch,
			report.total_tests,
		)})`,
	);
	console.log(
		`  ${pc.red(SYMBOLS.http_error)} HTTP Error:     ${http_error}  (${percentage(
			http_error,
			report.total_tests,
		)})`,
	);
	console.log();

	const issues_count = mismatch + http_error;
	if (issues_count > 0) {
		console.log(
			`Status: ${pc.red("NEEDS ATTENTION")} (${issues_count} issue${
				issues_count > 1 ? "s" : ""
			} found)`,
		);
	} else {
		console.log(`Status: ${pc.green("ALL TESTS PASSED")}`);
	}

	console.log();
	if (issues_count > 0) {
		console.log(pc.dim("Run with --verbose to see full object diffs."));
	}
}

function get_status_symbol(status: AuditResult["status"]): string {
	switch (status) {
		case "success":
			return SYMBOLS.pass;
		case "mismatch":
			return SYMBOLS.fail;
		case "http_error":
			return SYMBOLS.http_error;
		default:
			return "?";
	}
}

function get_status_color(
	status: AuditResult["status"],
): (text: string) => string {
	switch (status) {
		case "success":
			return pc.green;
		case "mismatch":
		case "http_error":
			return pc.red;
		default:
			return (text: string) => text;
	}
}

function get_status_text(
	status: AuditResult["status"],
	result: AuditResult,
): string {
	switch (status) {
		case "success":
			return "PASS (0 mismatches)";
		case "mismatch":
			return `FAIL (${result.mismatches?.length || 0} mismatches)`;
		case "http_error":
			return `HTTP ERROR (status ${result.http_status || "unknown"})`;
		default:
			return "UNKNOWN";
	}
}

function format_value(value: unknown): string {
	if (value === null) return pc.dim("null");
	if (value === undefined) return pc.dim("undefined");
	if (typeof value === "string") return `"${value}"`;
	if (Array.isArray(value)) {
		if (value.length === 0) return "[]";
		return `[${value.map((v) => format_value(v)).join(", ")}]`;
	}
	if (typeof value === "object") return JSON.stringify(value);
	return String(value);
}

function percentage(count: number, total: number): string {
	if (total === 0) return "0.0%";
	const pct = ((count / total) * 100).toFixed(1);
	return `${pct}%`;
}
