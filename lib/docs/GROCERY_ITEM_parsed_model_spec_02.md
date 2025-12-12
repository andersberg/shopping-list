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

## Parsing

For parser interface, implementation details, and parsing examples, see `grocery-parser-spec.md`.

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
