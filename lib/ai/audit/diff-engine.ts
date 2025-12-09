export interface FieldMismatch {
	field: string;
	expected: unknown;
	actual: unknown;
	diff_type: "value" | "type" | "missing" | "extra";
}

// Phase 1: All AI extraction fields
export const PHASE1_FIELDS_TO_COMPARE = [
	"raw_text",
	"raw_item",
	"raw_qty",
	"raw_unit",
	"raw_brand",
	"raw_modifiers",
	"raw_offer",
	"raw_size_value",
	"raw_size_unit",
	"raw_comment",
];

export function compare_objects(
	expected: Record<string, unknown>,
	actual: Record<string, unknown>,
	fieldsToCompare: string[],
): FieldMismatch[] {
	const mismatches: FieldMismatch[] = [];

	for (const field of fieldsToCompare) {
		const expected_value = expected[field];
		const actual_value = actual[field];

		if (!deep_equal(expected_value, actual_value)) {
			mismatches.push({
				field,
				expected: expected_value,
				actual: actual_value,
				diff_type: determine_diff_type(expected_value, actual_value),
			});
		}
	}

	return mismatches;
}

function deep_equal(a: unknown, b: unknown): boolean {
	// Handle null/undefined
	if (a === b) return true;
	if (a == null || b == null) return false;

	// Handle arrays
	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return false;
		return a.every((val, idx) => deep_equal(val, b[idx]));
	}

	// Handle objects
	if (typeof a === "object" && typeof b === "object") {
		const keys_a = Object.keys(a as object);
		const keys_b = Object.keys(b as object);
		if (keys_a.length !== keys_b.length) return false;
		return keys_a.every((key) => deep_equal((a as any)[key], (b as any)[key]));
	}

	// Primitive comparison
	return false;
}

function determine_diff_type(
	expected: unknown,
	actual: unknown,
): FieldMismatch["diff_type"] {
	if (expected === undefined) return "extra";
	if (actual === undefined) return "missing";
	if (typeof expected !== typeof actual) return "type";
	return "value";
}
