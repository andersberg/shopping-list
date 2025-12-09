import type { Ai, D1Database } from "@cloudflare/workers-types";

/**
 * Shared Cloudflare Worker binding contract for projects in this monorepo.
 */
export interface CloudflareEnvironmentBindings {
	/**
	 * Primary D1 database binding.
	 */
	Database: D1Database;

	/**
	 * Workers AI binding exposed as `env.AI`.
	 */
	// biome-ignore lint/style/useNamingConvention:  AI is a standard acronym matching the Cloudflare binding name
	AI: Ai;
}
