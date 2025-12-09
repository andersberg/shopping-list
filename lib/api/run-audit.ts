import pc from "picocolors";
import { run_audit } from "./audit/audit-runner";

interface CliOptions {
	api_url?: string;
	verbose?: boolean;
	filter?: string;
	timeout?: number;
	help?: boolean;
}

function parse_cli_args(args: string[]): CliOptions {
	const options: CliOptions = {};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];

		switch (arg) {
			case "--api-url":
				options.api_url = args[++i];
				break;
			case "--verbose":
			case "-v":
				options.verbose = true;
				break;
			case "--filter":
				options.filter = args[++i];
				break;
			case "--timeout":
				options.timeout = parseInt(args[++i], 10);
				break;
			case "--help":
			case "-h":
				options.help = true;
				break;
		}
	}

	return options;
}

function print_help(): void {
	console.log(`
${pc.bold("Phase 1 AI Extraction Audit")}

${pc.bold("Usage:")} pnpm audit:phase1 [options]

${pc.bold("Options:")}
  --api-url <url>      API endpoint URL (default: http://localhost:5180/api)
  --verbose, -v        Show detailed diff output
  --filter <pattern>   Run only tests matching pattern (supports * wildcard)
  --timeout <ms>       HTTP timeout in milliseconds (default: 30000)
  --help, -h           Show this help message

${pc.bold("Examples:")}
  ${pc.dim("# Run audit")}
  pnpm audit:phase1

  ${pc.dim("# Show detailed diffs")}
  pnpm audit:phase1 --verbose

  ${pc.dim("# Run specific tests")}
  pnpm audit:phase1 --filter "basic-*"

  ${pc.dim("# Custom API URL")}
  pnpm audit:phase1 --api-url http://localhost:3000/api
  `);
}

async function main() {
	const options = parse_cli_args(process.argv.slice(2));

	if (options.help) {
		print_help();
		process.exit(0);
	}

	const report = await run_audit({
		api_url: options.api_url || "http://localhost:5180/api",
		verbose: options.verbose || false,
		filter: options.filter,
		timeout_ms: options.timeout || 30000,
	});

	// Exit with code 1 if failures
	const has_failures = report.results.some(
		(r) => r.status === "mismatch" || r.status === "http_error",
	);

	process.exit(has_failures || report.status === "server_unavailable" ? 1 : 0);
}

main().catch((error) => {
	console.error(pc.red("Fatal error:"), error);
	process.exit(1);
});
