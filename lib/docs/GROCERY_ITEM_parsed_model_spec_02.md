# GROCERY_ITEM Parsed Model Specification

## Purpose

This model represents a parsed grocery list item. It captures user intent for purchasing groceries, supporting both manual and AI-based parsing from freeform string input.

The model is designed for a grocery list application where users input items like "2x 500 g pasta" or "2 flaskor cola 1.5 l Willys 3/50kr" and receive structured, queryable data.

## Language

The primary language is **Swedish**. This applies to:

- **User input** — "3 äpplen", "ekologisk mjölk", "krossade tomater"
- **Units** — "st" (styck), "burkar", "flaskor", "paket"
- **Properties** — "ekologisk", "laktosfri", "glutenfri"
- **Store names** — "Willys", "ICA", "Coop", "Hemköp"

Parsers should be optimized for Swedish patterns and vocabulary.

---

## Core Concepts

### Two-dimensional quantity model

The central design insight is that grocery items have **two orthogonal numeric dimensions**:

| Dimension | Fields | Meaning |
|-----------|--------|---------|
| **Purchase intent** | purchase_quantity + purchase_unit | How many packages/containers to buy |
| **Item specification** | item_size + item_unit | The size/measure of each package |

This separation allows expressing complex inputs like "2 flaskor cola 1.5 l" (2 bottles, each 1.5 liters) without ambiguity.

### Minimum input is purchase_quantity + item

The simplest valid input is "buy X of Y" — e.g., "3 äpplen" means purchase_quantity: 3, item: äpplen. Item size is optional and defaults to 1 st.

### Parsing rule: unit category determines field

How a number is interpreted depends on the unit that follows it:

| Pattern | Interpretation | Example |
|---------|----------------|---------|
| Number + size unit (g, kg, l, ml, etc.) | item_size + item_unit | "500 g" → item_size: 500, item_unit: g |
| Number + container unit (burkar, flaskor, etc.) | purchase_quantity + purchase_unit | "2 burkar" → purchase_quantity: 2, purchase_unit: burkar |
| Bare number (no unit) | purchase_quantity | "3 äpplen" → purchase_quantity: 3 |

This means unit category is essential for parsing, not just conversion.

### Containers are descriptive, not measurable

Units like "burkar", "flaskor", "paket" are semantically equivalent to "st" (pieces). They enrich the purchase description but don't carry measurable value. "2 burkar" equals "2 st" for calculation purposes.

### Never nullable quantities

All quantity and unit fields have sensible defaults (1, "st"). This simplifies application logic and ensures every item can be aggregated or compared.

---

## Model Definition

### GROCERY_ITEM

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| original_input | string | yes | — | Raw input string, preserved for traceability and re-parsing |
| item | string | yes | — | The product name as entered by user (for display) |
| item_canonical | ItemCanonical | no | null | Normalized item name for matching and aggregation — branded string, DB-driven |
| purchase_quantity | number | yes | 1 | Number of packages/containers to buy |
| purchase_unit | ContainerUnit | yes | "st" | Container type — branded string, DB-driven |
| item_size | number | yes | 1 | Size/measure of each package |
| item_unit | SizeUnit | yes | "st" | Unit of item_size — code enum (mg, g, hg, kg, ml, cl, dl, l, st) |
| comment | string | no | null | Unparsed or ambiguous info, also used for user notes |
| brand | Brand | no | null | Product brand — branded string, DB-driven |
| properties | Property[] | no | [] | Product attributes — branded strings, DB-driven |
| stores | Store[] | no | [] | Stores where item is available — branded strings, DB-driven |
| offer | Offer | no | null | Best deal to track (single offer, not per-store) |
| category | Category | no | null | Product category — branded string, DB-driven |
| parse_status | enum | yes | — | success, partial, error |
| parse_error | string | no | null | Error description when parse_status is error |
| parse_source | enum | yes | — | manual, ai |

#### Type definitions (Zod v4)

```typescript
// Code enum — static, affects business logic
const SizeUnit = z.enum(["mg", "g", "hg", "kg", "ml", "cl", "dl", "l", "st"]);

// Branded types — DB-driven, validated at runtime
const ContainerUnit = z.string().brand<"ContainerUnit">();
const Store = z.string().brand<"Store">();
const Brand = z.string().brand<"Brand">();
const Property = z.string().brand<"Property">();
const ItemCanonical = z.string().brand<"ItemCanonical">();
const Category = z.string().brand<"Category">();
```

### OFFER

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| quantity | number | yes | Number of items in the offer |
| price | number | yes | Total price for the offer quantity |
| currency | string | yes | Currency code — currently SEK only ("kr", "sek") |

**Currency support:** Currently only Swedish kronor (SEK) is supported, recognized as "kr" or "sek" in input. The currency field is a string (not enum) to allow future extension via the branded type + DB pattern if multi-currency support is needed.

---

## Related Model: UNIT

Units are split between code and database based on whether they affect business logic.

### Size units (code enum)

These are static and defined in code. They have conversion factors for aggregation.

| id | category | base_unit | conversion_factor | abbreviations |
|----|----------|-----------|-------------------|---------------|
| mg | weight | null | 1 | ["mg", "milligram"] |
| g | weight | mg | 1000 | ["g", "gr", "gram"] |
| hg | weight | mg | 100000 | ["hg", "hekto", "hektogram"] |
| kg | weight | mg | 1000000 | ["kg", "kilo", "kilogram"] |
| ml | volume | null | 1 | ["ml", "milliliter"] |
| cl | volume | ml | 10 | ["cl", "centiliter"] |
| dl | volume | ml | 100 | ["dl", "deciliter"] |
| l | volume | ml | 1000 | ["l", "liter"] |
| st | count | null | 1 | ["st", "stk", "styck", "stycken"] |

### Container units (DB-driven)

These are descriptive and user-editable. They are semantically equivalent to "st" (no conversion factors).

| id | category | abbreviations |
|----|----------|---------------|
| burkar | count | ["burk", "burkar"] |
| flaskor | count | ["flaska", "flaskor"] |
| paket | count | ["paket", "pkt"] |
| kartonger | count | ["kartong", "kartonger"] |
| påsar | count | ["påse", "påsar"] |

New containers can be added in the DB without code deployment. If a container isn't recognized, the parser falls back to "st".

---

## Derived Fields

These are computed at read time, not stored:

| Field | Formula | Description |
|-------|---------|-------------|
| total_quantity_value | purchase_quantity × item_size | Total amount being purchased |
| total_quantity_unit | item_unit (normalized) | Unit of total quantity |
| offer_unit_price | offer.price / offer.quantity | Price per item in offer |

---

## Architecture

### Separation of Concerns

The model implementation maintains clear separation between:

- **Parsing Logic**: Text processing, tokenization, pattern recognition, extraction of raw data from input strings
- **Domain Logic**: Business rules, canonicalization, normalization, validation, transformation of raw data into domain objects

This architectural separation provides:
- **Independent Testing**: Business rules can be tested without parsing complexity
- **Reusability**: Domain services work with any parser (manual, AI, future implementations)
- **Maintainability**: Clear boundaries make code easier to understand and modify
- **Performance**: Domain logic can be optimized and cached independently

### Parser Interface

Parsers are responsible for extracting structured tokens from text, not for applying business rules:

```typescript
interface ParsedTokens {
  raw_item: string | null;
  raw_quantity: string | null;
  raw_unit: string | null;
  raw_brand: string | null;
  raw_modifiers: string[];
  raw_offer: string | null;
  raw_size_value: string | null;
  raw_size_unit: string | null;
  raw_comment: string | null;
}

interface GroceryParser {
  source: "manual" | "ai";
  parse(input: string): ParsedTokens;
}
```

### Domain Services

Business logic is implemented in domain services that transform ParsedTokens into GroceryItem objects:

```typescript
// Core domain services
function canonicalize_item(item: string | null): { canonical: ItemCanonical | null; category: Category | null }
function normalize_unit(unit: string | null): SizeUnit | ContainerUnit | null
function parse_offer_string(offer_text: string | null): Offer | null
function extract_properties(modifiers: string[]): Property[]
function extract_organic_flag(modifiers: string[]): boolean
function normalize_store_name(store: string | null): Store | null
function normalize_brand_name(brand: string | null): Brand | null
function determine_parse_status(item: ItemCanonical | null, category: Category | null, error: string | null): "ok" | "needs_review" | "parse_error"

// Factory function that applies all domain logic
function create_grocery_item_from_tokens(
  tokens: ParsedTokens, 
  source: "manual" | "ai"
): GroceryItem
```

### Implementation Guidelines

#### Domain-First Architecture
- **Business Logic Location**: All domain logic lives in `lib/domain/` directory
- **Parser Responsibility**: Parsers only handle text-to-structured-data conversion
- **Service Reusability**: Domain services are designed to work with any parser implementation
- **Factory Functions**: All branded types use factory functions for runtime validation

#### Error Handling
- **Parsing Errors**: Malformed input, unrecognized patterns
- **Domain Errors**: Invalid values, business rule violations
- **Status Determination**: `ok` (valid), `needs_review` (unknown values), `parse_error` (parsing failed)

#### Performance Considerations
- **Caching**: Domain services can cache expensive operations (category lookups, validations)
- **Lazy Evaluation**: Expensive validations only when needed
- **Batch Processing**: Domain services designed for bulk operations

## Testing Requirements

### Domain Logic Coverage
All business rules must have comprehensive unit tests independent of parsing logic:

#### Required Test Coverage
- **Item Canonicalization**: 100% coverage of known items, pluralization rules, unknown items
- **Unit Normalization**: All unit variations, invalid inputs, edge cases
- **Offer Parsing**: Valid offers, malformed offers, edge cases (zero quantities, negative prices)
- **Status Determination**: All status conditions, error scenarios
- **Property Extraction**: Organic detection, modifier parsing
- **Store/Brand Normalization**: Case variations, unknown values, validation

#### Test Structure
```typescript
describe("Domain Services", () => {
  describe("canonicalize_item", () => {
    it("should canonicalize known items correctly")
    it("should handle pluralization rules")
    it("should return unknown items as-is with null category")
    it("should handle null and empty inputs")
  });

  describe("normalize_unit", () => {
    it("should normalize common unit variations")
    it("should return null for invalid units")
    it("should handle ambiguous units correctly")
  });
});
```

#### Integration Tests
- **Model + Services**: Verify domain services work correctly with GroceryItem model
- **End-to-End**: Complete workflows from parser input to final GroceryItem
- **Edge Cases**: Complex inputs, malformed data, error conditions

#### Parser-Domain Separation
- **Parser Tests**: Focus on text extraction accuracy, tokenization, pattern recognition
- **Domain Service Tests**: Focus on business rule correctness, validation, transformation
- **Integration Tests**: Verify parser → domain service → model pipeline works correctly

### Test Data Management
- **Shared Test Cases**: Centralized test data in `lib/parsers/shared/test-cases.ts`
- **Edge Case Library**: Comprehensive collection of problematic inputs
- **Regression Tests**: Ensure fixes don't break existing functionality
- **Performance Tests**: Validate domain service performance under load

## Parsing

For detailed parser implementation, patterns, and examples, see `grocery-parser-spec.md`.

### Parser Responsibilities
- **Text Processing**: Normalization, tokenization, pattern recognition
- **Data Extraction**: Pull raw values from input strings
- **Structure Creation**: Build ParsedTokens object
- **Error Detection**: Identify parsing failures and malformed input

### Parser Limitations
- **No Business Logic**: Parsers don't apply canonicalization, normalization, or validation rules
- **No Domain Decisions**: Parsers don't determine categories, status, or calculate derived values
- **Stateless**: Each parse operation is independent
- **Text Focus**: Only concerned with converting text to structured data

---

## Design Decisions

### 1. Two numeric dimensions over one

**Decision:** Separate purchase_quantity/purchase_unit from item_size/item_unit.

**Rationale:** "3 500 g pasta" cannot be modeled with a single quantity field without losing information. The user wants 3 packages, each containing 500 g. Collapsing to "1500 g" loses the package boundary which may be significant (pricing, storage, recipe portioning).

### 2. Bare numbers are purchase_quantity

**Decision:** A leading number without a unit is always purchase_quantity, not item_size.

**Rationale:** The minimum valid input is "buy X of Y" — e.g., "3 äpplen" means "buy 3 apples". This matches user intent. Item size is optional additional information that requires an explicit unit to distinguish it.

### 3. Never-null quantity fields with defaults

**Decision:** All quantity and unit fields are required with defaults of 1 and "st".

**Rationale:** Simplifies aggregation and comparison logic. "pasta" and "1 st pasta" are equivalent — the model treats them identically.

### 4. Containers as count units, not a separate concept

**Decision:** "burkar", "flaskor", etc. are valid purchase_unit values in the count category, not a separate packaging concept.

**Rationale:** We couldn't find a case where packaging needed to be a first-class field. Container info is either implied by size (1.5 l → bottle), part of item identity when it matters, or captured in purchase_unit.

### 5. Single original_input instead of *_raw fields

**Decision:** Store the original input once rather than raw + normalized for each field.

**Rationale:** All raw values are recoverable by re-parsing. Eliminates field duplication and keeps the model clean.

### 6. Ranges parsed as max value

**Decision:** "2-3 äpplen" parses to purchase_quantity: 3, not a min/max range.

**Rationale:** Ranges are uncommon. Taking the max is pragmatic (better to overbuy than underbuy). Original input preserves the range if needed.

### 7. Properties as string array, not individual booleans

**Decision:** properties: string[] rather than organic: boolean, lactose_free: boolean, etc.

**Rationale:** Extensible without schema changes. New properties ("vegansk", "KRAV") just need parser updates, not model changes.

### 8. Comment serves dual purpose

**Decision:** comment holds both unparsed data and user-added notes.

**Rationale:** From a data perspective, "till lasagnen" is the same whether it couldn't be parsed or was intentionally added as a note. Both are human-readable context that doesn't fit structured fields.

### 9. Predefined lists for controlled values

**Decision:** Units, stores, brands, and properties are validated against predefined lists rather than allowing freeform strings.

**Rationale:** 
- **Units:** Required for conversion and aggregation. Freeform units ("grams" vs "g" vs "gr") would break calculations.
- **Stores:** Normalization enables filtering and grouping by store. "willys" → "Willys", "ica maxi" → "ICA Maxi".
- **Properties:** Consistent values ("ekologisk" not "eko", "organic", "Ekologisk") enable filtering and search.
- **Brands:** Optional but useful for normalization and item library matching.

Unknown values that don't match predefined lists should go to comment rather than being silently dropped.

### 10. Static vs dynamic vocabulary architecture

**Decision:** Size units are code enums; containers, stores, brands, and properties are DB-driven with branded types.

**Rationale:** Different vocabularies have different characteristics:

| Vocabulary | Change frequency | Affects business logic | User-editable |
|------------|------------------|------------------------|---------------|
| Size units | Rarely | Yes — conversion, aggregation | No |
| Containers | Occasionally | No — descriptive only | Yes |
| Stores | Occasionally | No — filtering only | Yes |
| Brands | Frequently | No — filtering only | Yes |
| Properties | Occasionally | No — filtering only | Yes |
| Item canonical | Frequently | No — matching only | Yes |
| Categories | Occasionally | No — filtering only | Yes |

Size units are fundamental to business logic — conversion factors and aggregation depend on knowing exactly what units exist. The metric system rarely changes. Code deployment for new units is acceptable.

Everything else is "data, not code" — validated at parse time against DB, with model defaults as fallback.

**Implementation:**

| Vocabulary | Source | Zod strategy | Fallback |
|------------|--------|--------------|----------|
| Size units | Code | `z.enum(["mg", "g", "hg", "kg", "ml", "cl", "dl", "l", "st"])` | — |
| Containers | DB | `z.string().brand<"ContainerUnit">()` | "st" |
| Stores | DB | `z.array(z.string().brand<"Store">())` | [] |
| Brands | DB | `z.string().brand<"Brand">()` | null |
| Properties | DB | `z.string().brand<"Property">()` | [] |
| Item canonical | DB | `z.string().brand<"ItemCanonical">()` | null |
| Categories | DB | `z.string().brand<"Category">()` | null |

Branded types (Zod v4) provide type distinction without autocomplete dependency — you can't accidentally assign a `Store` to a `Brand` field, but adding new values doesn't require code changes.

### 11. Separate item (display) from item_canonical (matching)

**Decision:** Two fields for item name — `item` preserves user input for display, `item_canonical` normalizes for aggregation and matching. The item library is DB-driven.

**Rationale:** Users expect to see what they typed ("grön mjölk"), but the system needs a canonical form ("mellanmjölk") for:
- **Aggregation** — "grön mjölk" + "mellanmjölk" should combine
- **Search** — searching "mjölk" finds both variants
- **Item library** — linking to common items with prefilled data (category, default size, etc.)

The item library (DB) maps aliases/variants to canonical names:
- "mjölk grön", "grön mjölk" → "mellanmjölk"
- "mjölk blå", "blå mjölk" → "lättmjölk"
- "äpplen", "äpple" → "äpple"

`item_canonical` is null if no mapping exists — the item is still valid, just not normalized.

### 12. Multiple stores, single offer

**Decision:** `stores` is an array (item available at multiple stores), but `offer` is singular (one best deal).

**Rationale:** 
- **stores** answers "where can I buy this?" — useful for filtering, shopping route planning, or items only available at select stores
- **offer** answers "what's the best deal?" — user adds one offer they want to track

This is intentional. If a user finds deals at multiple stores, they pick the best one. The model doesn't support per-store offers because that's comparison shopping, not purchase intent.

If multiple offers appear in input (rare), parser takes the first and puts the rest in comment.

---

## Validation Rules

1. purchase_quantity must be ≥ 1
2. item_size must be ≥ 0 (0 could indicate "unknown size")
3. item must be non-empty after parsing
4. If offer is present, offer.quantity must be ≥ 1 and offer.price must be ≥ 0
5. item_unit must be a valid SizeUnit (code enum validation)
6. purchase_unit validated against DB container list (falls back to "st" if not found)
7. stores, brand, properties, item_canonical, category validated against respective DB lists (empty array/null if not found)

---

## Testing Requirements

### Domain Logic Coverage
All business rules must have comprehensive unit tests independent of parsing logic:

#### Required Test Coverage
- **Item Canonicalization**: 100% coverage of known items, pluralization rules, unknown items
- **Unit Normalization**: All unit variations, invalid inputs, edge cases
- **Offer Parsing**: Valid offers, malformed offers, edge cases (zero quantities, negative prices)
- **Status Determination**: All status conditions, error scenarios
- **Property Extraction**: Organic detection, modifier parsing
- **Store/Brand Normalization**: Case variations, unknown values, validation

#### Test Structure
```typescript
describe("Domain Services", () => {
  describe("canonicalize_item", () => {
    it("should canonicalize known items correctly")
    it("should handle pluralization rules")
    it("should return unknown items as-is with null category")
    it("should handle null and empty inputs")
  });

  describe("normalize_unit", () => {
    it("should normalize common unit variations")
    it("should return null for invalid units")
    it("should handle ambiguous units correctly")
  });
});
```

#### Integration Tests
- **Model + Services**: Verify domain services work correctly with GroceryItem model
- **End-to-End**: Complete workflows from parser input to final GroceryItem
- **Edge Cases**: Complex inputs, malformed data, error conditions

#### Parser-Domain Separation
- **Parser Tests**: Focus on text extraction accuracy, tokenization, pattern recognition
- **Domain Service Tests**: Focus on business rule correctness, validation, transformation
- **Integration Tests**: Verify parser → domain service → model pipeline works correctly

### Test Data Management
- **Shared Test Cases**: Centralized test data in `lib/parsers/shared/test-cases.ts`
- **Edge Case Library**: Comprehensive collection of problematic inputs
- **Regression Tests**: Ensure fixes don't break existing functionality
- **Performance Tests**: Validate domain service performance under load

### Quality Standards
- **Coverage**: Domain services must achieve 90%+ test coverage
- **Edge Cases**: All identified edge cases must have corresponding tests
- **Documentation**: Complex business rules must have test documentation explaining expected behavior
- **CI/CD**: All domain service tests must run in continuous integration

## Aggregation Rules

Items can be aggregated when:

1. item_canonical matches (or item if item_canonical is null)
2. item_unit is in the same UNIT.category
3. brand matches (or both null)
4. properties match

Aggregation formula:
- Convert both item_size values to base unit
- Sum: (purchase_quantity₁ × item_size₁) + (purchase_quantity₂ × item_size₂)
- Result can be expressed as single item with purchase_quantity: 1, item_size: total

Note: Aggregation loses purchase_unit information (burkar vs flaskor) — this may or may not be acceptable depending on use case.
