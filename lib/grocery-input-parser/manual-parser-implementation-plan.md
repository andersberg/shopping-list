# Manual Parser Implementation Plan

This plan outlines the implementation of the deterministic `ManualParser` in `lib/GroceryInputParser/ManualParser.ts`, following the specification in `lib/manual-parser-specification.md`.

## 1. Setup & Type Definitions

- [ ] **Create File**: `lib/GroceryInputParser/ManualParser.ts`.
- [ ] **Imports**: 
    - Reuse existing data files from `lib/AI/GroceryInputParser/`:
        - `brand-names.ts`
        - `store-names.ts`
        - `quantity-units.ts`
        - `size-units.ts`
        - `category-names.ts`
- [ ] **Define Types**:
    - `ParsedResult`: Alias of `GroceryItem` (from `@lib/GroceryItem.ts`).
        - Map spec status `partial` -> `needs_review`.
        - Map spec status `error` -> `parse_error`.
    - **Pipeline Types**:
        - `NormalizedInput`
        - `Token` & `TokenType`
        - `AnnotatedToken` & `TokenLabel`
        - `ParsedDraft`

## 2. Pipeline Step 1: Pre-normalization

- [ ] **Implement** `pre_normalize(input: string): NormalizedInput`
    - [ ] Trim whitespace & collapse multiple spaces.
    - [ ] **Key Rule**: Split stuck numbers/units (e.g., "1.5kg" -> "1.5 kg") using Regex `(\d)([a-zA-Z%])`.
    - [ ] Normalize decimal separators (`,` -> `.`).
    - [ ] Normalize currency (`:-`, `KR` -> `kr`).
    - [ ] Lowercase the text for processing (keep original for display).

## 3. Pipeline Step 2: Tokenization

- [ ] **Implement** `tokenize(input: NormalizedInput): Token[]`
    - [ ] Split `normalized_text` by spaces.
    - [ ] Classify tokens:
        - `number`: matches numeric regex.
        - `price`: matches price patterns (e.g., `4/50kr`).
        - `word`: default.

## 4. Pipeline Step 3: Annotation (Lexicon Matching)

- [ ] **Implement** `annotate(tokens: Token[]): AnnotatedToken[]`
    - [ ] Iterate tokens and push `labels`:
        - **Quantity/Size**: If number.
        - **Units**: Match against imported `QUANTITY_UNITS` and `SIZE_UNITS`.
        - **Brands**: Match against `BRAND_NAMES`.
        - **Stores**: Match against `STORE_NAMES`.
        - **Organic**: Match against local list `['eko', 'ekologisk', 'krav', 'organic']`.
        - **Items**: 
            - Use a local constant list for common items (as per spec).
            - Heuristic: Tag words that aren't units/brands/stores/offers as `item_candidate`.

## 5. Pipeline Step 4: Grammar (Rule-Based Interpretation)

- [ ] **Implement** `interpret_grammar(tokens: AnnotatedToken[]): ParsedDraft`
    - [ ] Initialize empty `ParsedDraft`.
    - [ ] Track used tokens to avoid double-consumption.
    - [ ] **Apply Rules in Order**:
        1.  **Offers**: Detect `N för P` or `N/P` patterns.
        2.  **Quantity**: Leftmost unused number.
        3.  **Size**: Unused number followed by `size_unit_candidate`.
        4.  **Item**: Unused `item_candidate` (prefer closest to quantity/size or leftmost).
        5.  **Brand**: Remaining `brand_candidate` tokens.
        6.  **Store**: Remaining `store_candidate` tokens.
        7.  **Organic**: Any `organic_tag`.
        8.  **Comment**: All remaining unused words.

## 6. Pipeline Step 5: Post-processing & Validation

- [ ] **Implement** `post_process(draft: ParsedDraft): ParsedResult`
    - [ ] **Calculations**:
        - `total_quantity_value = quantity * size_value`
        - `offer_unit_price = offer_total_price / offer_quantity`
    - [ ] **Defaults**: Set null numbers to `0`.
    - [ ] **Status**:
        - `ok`: Item found.
        - `needs_review`: Item found but ambiguous (e.g., missing quantity).
        - `parse_error`: No item found.
    - [ ] **Map Output**: Construct final `ParsedResult` object.

## 7. Verification

- [ ] **Create Test File**: `lib/GroceryInputParser/ManualParser.test.ts`.
- [ ] **Test Cases**:
    - Standard: "3 pkt mjölk"
    - Complex: "3 pkt 1,5l mjölk eko arla 4/50kr ica"
    - Offer variants: "3 för 20kr", "299kr"
    - Edge cases: "mjölk" (no quantity), "1.5kg" (stuck unit).
