import { describe, expect, it } from "vitest";
import { ManualParser } from "./manual-parser";
import { SHARED_TEST_CASES } from "../shared/test-cases";

describe("ManualParser", () => {
	const parser = new ManualParser();

	SHARED_TEST_CASES.forEach((testCase) => {
		it(`should parse ${testCase.id}`, () => {
			const result = parser.parse(testCase.input);
			expect(result).toMatchObject(testCase.expected_grocery_item);
		});
	});
});
