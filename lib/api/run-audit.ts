import pc from "picocolors";
import { run_audit } from "./audit/audit-runner";

interface CliOptions {
  account_id?: string;
  api_token?: string;
  model_id?: string;
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
      case "--account-id":
        options.account_id = args[++i];
        break;
      case "--api-token":
        options.api_token = args[++i];
        break;
      case "--model-id":
        options.model_id = args[++i];
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
  --account-id <id>    Cloudflare account ID (or set CLOUDFLARE_ACCOUNT_ID)
  --api-token <token>  Cloudflare API token (or set CLOUDFLARE_API_TOKEN)
  --model-id <model>   AI model ID (default: @cf/meta/llama-3.1-8b-instruct-fast)
  --verbose, -v        Show detailed diff output
  --filter <pattern>   Run only tests matching pattern (supports * wildcard)
  --timeout <ms>       HTTP timeout in milliseconds (default: 30000)
  --help, -h           Show this help message

${pc.bold("Environment Variables:")}
  CLOUDFLARE_ACCOUNT_ID  Cloudflare account ID
  CLOUDFLARE_API_TOKEN   Cloudflare API token

${pc.bold("Examples:")}
  ${pc.dim("# Run audit using environment variables")}
  export CLOUDFLARE_ACCOUNT_ID=your_account_id
  export CLOUDFLARE_API_TOKEN=your_api_token
  pnpm audit:phase1

  ${pc.dim("# Show detailed diffs")}
  pnpm audit:phase1 --verbose

  ${pc.dim("# Run specific tests")}
  pnpm audit:phase1 --filter "basic-*"

  ${pc.dim("# Use custom model")}
  pnpm audit:phase1 --model-id @cf/meta/llama-3.1-8b-instruct

  ${pc.dim("# Pass credentials via CLI")}
  pnpm audit:phase1 --account-id abc123 --api-token xyz789
  `);
}

async function main() {
  const options = parse_cli_args(process.argv.slice(2));

  if (options.help) {
    print_help();
    process.exit(0);
  }

  // Get credentials from CLI args or environment variables
  const account_id =
    options.account_id || process.env.CLOUDFLARE_ACCOUNT_ID || "";
  const api_token = options.api_token || process.env.CLOUDFLARE_API_TOKEN || "";

  if (!account_id || !api_token) {
    console.error(
      pc.red(
        "Error: Missing Cloudflare credentials. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN environment variables, or pass --account-id and --api-token flags.",
      ),
    );
    console.error(pc.dim("\nRun with --help for more information."));
    process.exit(1);
  }

  const report = await run_audit({
    cloudflare_account_id: account_id,
    cloudflare_api_token: api_token,
    model_id: options.model_id,
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
