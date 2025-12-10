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
| item | string | yes | — | The product name ("pasta", "mjölk", "äpplen") |
| purchase_quantity | number | yes | 1 | Number of packages/containers to buy |
| purchase_unit | string | yes | "st" | Container type (st, flaskor, burkar, paket, kartonger, påsar) |
| item_size | number | yes | 1 | Size/measure of each package |
| item_unit | string | yes | "st" | Unit of item_size (g, hg, kg, ml, cl, dl, l, st) |
| comment | string | no | null | Unparsed or ambiguous info, also used for user notes |
| brand | string | no | null | Product brand ("Arla", "Felix", "Barilla") |
| properties | string[] | no | [] | Product attributes ("ekologisk", "laktosfri", "glutenfri") |
| store | string | no | null | Normalized store name where item should be purchased |
| offer | Offer | no | null | Discount/offer structure if present |
| category | string | no | null | Product category, from user input or item library |
| parse_status | enum | yes | — | success, partial, error |
| parse_error | string | no | null | Error description when parse_status is error |
| parse_source | enum | yes | — | manual, ai |

### OFFER

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| quantity | number | yes | Number of items in the offer |
| price | number | yes | Total price for the offer quantity |
| currency | string | yes | Currency code ("kr", "sek") |

---

## Related Model: UNIT

Units should be defined in a separate lookup table to support parsing and conversion.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | yes | Canonical identifier ("g", "kg", "burkar") |
| category | enum | yes | weight, volume, count |
| base_unit | string | no | Reference unit for conversion (null if this is the base) |
| conversion_factor | number | no | Multiply by this to convert to base unit |
| abbreviations | string[] | yes | Aliases for parsing ("g", "gr", "gram") |

### Unit categories

| Category | Units | Base unit |
|----------|-------|-----------|
| weight | g, hg, kg | g |
| volume | ml, cl, dl, l | ml |
| count | st, burkar, flaskor, paket, kartonger, påsar | st |

---

## Derived Fields

These are computed at read time, not stored:

| Field | Formula | Description |
|-------|---------|-------------|
| total_quantity_value | purchase_quantity × item_size | Total amount being purchased |
| total_quantity_unit | item_unit (normalized) | Unit of total quantity |
| offer_unit_price | offer.price / offer.quantity | Price per item in offer |

---

## Parsing Examples

| Input | purchase_quantity | purchase_unit | item_size | item_unit | item | Other fields |
|-------|-------------------|---------------|-----------|-----------|------|--------------|
| "pasta" | 1 | st | 1 | st | pasta | |
| "3 äpplen" | 3 | st | 1 | st | äpplen | |
| "500 g pasta" | 1 | st | 500 | g | pasta | |
| "3 500 g pasta" | 3 | st | 500 | g | pasta | |
| "1.5 l cola" | 1 | st | 1.5 | l | cola | |
| "1 kg bananer" | 1 | st | 1 | kg | bananer | |
| "6-pack öl" | 1 | st | 6 | st | öl | |
| "2 6-pack öl" | 2 | st | 6 | st | öl | |
| "2 burkar krossade tomater" | 2 | burkar | 1 | st | krossade tomater | |
| "2 flaskor cola 1.5 l" | 2 | flaskor | 1.5 | l | cola | |
| "400 g burk krossade tomater" | 1 | burk | 400 | g | krossade tomater | |
| "4 mjölk 1.5l" | 4 | st | 1.5 | l | mjölk | |
| "eko mjölk Arla" | 1 | st | 1 | st | mjölk | brand: "Arla", properties: ["ekologisk"] |
| "cola Willys 3/50kr" | 1 | st | 1 | st | cola | store: "Willys", offer: {quantity: 3, price: 50, currency: "kr"} |
| "mjölk till lasagnen" | 1 | st | 1 | st | mjölk | comment: "till lasagnen" |
| "4 mjölk grön 1.5l eko Willys 4/20kr" | 4 | st | 1.5 | l | mjölk | properties: ["ekologisk"], store: "Willys", offer: {quantity: 4, price: 20, currency: "kr"}, comment: "grön" |

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

---

## Validation Rules

1. purchase_quantity must be ≥ 1
2. item_size must be ≥ 0 (0 could indicate "unknown size")
3. item must be non-empty after parsing
4. If offer is present, offer.quantity must be ≥ 1 and offer.price must be ≥ 0
5. purchase_unit should match a known UNIT.id where category is "count"
6. item_unit should match a known UNIT.id

---

## Aggregation Rules

Items can be aggregated when:

1. item matches (normalized)
2. item_unit is in the same UNIT.category
3. brand matches (or both null)
4. properties match

Aggregation formula:
- Convert both item_size values to base unit
- Sum: (purchase_quantity₁ × item_size₁) + (purchase_quantity₂ × item_size₂)
- Result can be expressed as single item with purchase_quantity: 1, item_size: total

Note: Aggregation loses purchase_unit information (burkar vs flaskor) — this may or may not be acceptable depending on use case.

---

## Implementation Notes

### Parser architecture: cascading fallback

The parsing system uses a three-stage fallback approach:

```
┌─────────────────┐
│  User input     │
└────────┬────────┘
         ▼
┌─────────────────┐     success    ┌─────────────────┐
│  Manual parser  │ ──────────────▶│  Complete model │
└────────┬────────┘                └─────────────────┘
         │ partial/error
         ▼
┌─────────────────┐     success    ┌─────────────────┐
│  AI parser      │ ──────────────▶│  Complete model │
└────────┬────────┘                └─────────────────┘
         │ partial/error
         ▼
┌─────────────────┐
│  Manual review  │  Unparsed data saved in comment
└─────────────────┘
```

1. **Manual parser** — Fast, deterministic, handles canonical patterns
2. **AI parser** — Receives original input + incomplete model, handles edge cases and ambiguity
3. **Manual review** — User corrects remaining issues, unparsed data preserved in comment

This balances performance (most inputs handled by fast manual parser) with flexibility (AI handles the long tail).

### Manual parser responsibilities

1. Extract offer pattern first ("3/50kr") — most specific, avoids number confusion
2. Extract known stores, brands, properties via lookup
3. Extract size+unit patterns ("500g", "1.5 l")
4. Extract container patterns ("2 burkar", "3 flaskor")
5. Extract leading bare number as purchase_quantity
6. Remaining tokens → item name (first match against item library, then raw)
7. Unmatched tokens → comment
8. Set parse_status based on confidence

### Number interpretation rules

| Pattern | Field | Example |
|---------|-------|---------|
| `{number}{size_unit}` | item_size + item_unit | "500g" → item_size: 500 |
| `{number} {size_unit}` | item_size + item_unit | "1.5 l" → item_size: 1.5 |
| `{number} {container_unit}` | purchase_quantity + purchase_unit | "2 burkar" → purchase_quantity: 2 |
| `^{number} ` (leading bare) | purchase_quantity | "3 äpplen" → purchase_quantity: 3 |
| `{number}-pack` | item_size (special pattern) | "6-pack" → item_size: 6 |

### AI parser guidance

When using AI for parsing, provide:

1. The original input string
2. The incomplete model from manual parser (if any)
3. The UNIT lookup table
4. Known stores, brands, properties lists
5. Example input/output pairs from this specification
6. Instruction to preserve unparsed segments in comment
7. Instruction to set parse_status: partial when uncertain

### Manual parser patterns

Common Swedish patterns to handle:

- "X Y" where no unit → purchase_quantity: X, item: Y
- "Xkg/Xg/Xl/etc Y" or "X kg/g/l Y" → item_size: X, item_unit: kg/g/l, item: Y
- "X burkar/flaskor/paket Y" → purchase_quantity: X, purchase_unit: burkar/etc, item: Y
- "{size} {container} {item}" → "400 g burk tomater" = purchase_unit: burk, item_size: 400, item_unit: g
- "N/Mkr" → offer: {quantity: N, price: M, currency: kr}
- "eko"/"ekologisk" → properties: ["ekologisk"]
- "X-pack" → item_size: X, item_unit: st
