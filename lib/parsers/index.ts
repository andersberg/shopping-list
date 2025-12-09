// Export all parsers for unified access
export { ManualParser } from "./manual/manual-parser";
export { AiParser } from "./ai/ai-parser";
export type { GroceryParser } from "./shared/parser-interface";

// Re-export shared utilities for external use
export {
	canonicalize_item,
	map_item_to_category,
	extract_store_from_text,
	apply_default_quantity,
	determine_status,
	normalize_brand,
	parse_offer,
	extract_organic,
	create_error_grocery_item,
} from "./shared/parser-utils";

// Re-export test cases for testing
export { SHARED_TEST_CASES } from "./shared/test-cases";
