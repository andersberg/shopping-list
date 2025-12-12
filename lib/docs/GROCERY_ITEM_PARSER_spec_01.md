# GROCERY_ITEM Parser Specification

## Purpose

This specification defines the interface and contract for parsing grocery item input into the GROCERY_ITEM model. It covers both the manual parser and AI parser.

For the GROCERY_ITEM model definition, see `grocery-item-spec.md`.

## Language

The primary language is **Swedish**. Parsers should be optimized for Swedish patterns and vocabulary.

---

## Parser Interface

### Input

Both parsers accept the same input type — either a raw string or a partially parsed model:

```typescript
type ParserInput = Partial<GroceryItem> & { original_input: string };
```

| Scenario | Input | Behavior |
|----------|-------|----------|
| Fresh parse | `{ original_input: "3 äpplen" }` | Parse from scratch |
| Enrich existing | `{ original_input: "3 äpplen", item: "äpplen", purchase_quantity: 3 }` | Validate and enrich |
| Re-parse | Full model with all fields | Re-validate against current DB data |

### Output

```typescript
type ParserOutput = GroceryItem; // Complete model with all required fields
```

The parser always returns a complete model. Missing optional fields use defaults:
- `purchase_quantity`: 1
- `purchase_unit`: "st"
- `item_size`: 1
- `item_unit`: "st"
- `stores`: []
- `properties`: []
- `comment`: null
- `brand`: null
- `offer`: null
- `category`: null
- `item_canonical`: null

### Parse status

| Status | Meaning |
|--------|---------|
| `success` | All tokens parsed, high confidence |
| `partial` | Some tokens unparsed or low confidence on some fields |
| `error` | Critical failure, item field could not be determined |

---

## Parser Architecture

### Cascading fallback

```
┌─────────────────┐
│  ParserInput    │
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
2. **AI parser** — Receives input + incomplete model, handles edge cases and ambiguity
3. **Manual review** — User corrects remaining issues, unparsed data preserved in comment

This balances performance (most inputs handled by fast manual parser) with flexibility (AI handles the long tail).

### When to cascade to AI parser

- `parse_status` is `partial` or `error`
- Confidence score below threshold (if implemented)
- Unparsed tokens remain that aren't clearly comments

---

## Data Sources

### Static (code enum)

**Size units** — Always available, no DB dependency:

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

### Dynamic (DB)

Loaded at parse time or cached:

| Vocabulary | Fallback if not found |
|------------|----------------------|
| Containers | "st" |
| Stores | [] (empty array) |
| Brands | null |
| Properties | [] (empty array) |
| Item library (canonical + category) | null |

---

## Manual Parser

### Responsibilities

1. Extract offer pattern first ("3/50kr") — most specific, avoids number confusion
2. Extract known stores, brands, properties via **DB lookup**
3. Extract size+unit patterns ("500g", "1.5 l") — size units from **code enum**
4. Extract container patterns ("2 burkar", "3 flaskor") — containers from **DB lookup**, fallback to "st"
5. Extract leading bare number as purchase_quantity
6. Remaining tokens → item name, then lookup item_canonical and category from **item library (DB)**
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

### Common Swedish patterns

- "X Y" where no unit → purchase_quantity: X, item: Y
- "Xkg/Xg/Xl/etc Y" or "X kg/g/l Y" → item_size: X, item_unit: kg/g/l, item: Y
- "X burkar/flaskor/paket Y" → purchase_quantity: X, purchase_unit: burkar/etc, item: Y
- "{size} {container} {item}" → "400 g burk tomater" = purchase_unit: burk, item_size: 400, item_unit: g
- "N/Mkr" → offer: {quantity: N, price: M, currency: "kr"}
- "eko"/"ekologisk" → properties: ["ekologisk"]
- "X-pack" → item_size: X, item_unit: st

### Handling partial input

When input includes pre-populated fields:

1. **Preserve provided values** — Don't overwrite unless re-parsing from original_input
2. **Validate against DB** — Check that provided stores/brands/etc exist
3. **Enrich missing fields** — Fill in item_canonical, category if item is provided but canonical isn't
4. **Re-calculate if needed** — If purchase_quantity changes, derived fields may need update

---

## AI Parser

### Input contract

When invoking the AI parser, provide:

1. The original input string
2. The incomplete model from manual parser (if any)
3. The size units list (code enum: mg, g, hg, kg, ml, cl, dl, l, st)
4. The container units list (from DB)
5. Known stores, brands, properties lists (from DB)
6. Item library with canonical names and categories (from DB)
7. Example input/output pairs
8. Instruction to preserve unparsed segments in comment
9. Instruction to set parse_status: partial when uncertain

### Output contract

AI parser must return a complete GroceryItem model with:

- All required fields populated
- `parse_source: "ai"`
- `parse_status` reflecting confidence
- Unparsed/ambiguous content in `comment`

### AI parser should handle

- Non-canonical word order
- Misspellings and typos
- Ambiguous quantities
- Complex multi-part items ("krossade tomater på burk")
- Implicit information ("cola" → likely wants bottle/can)

---

## Parsing Examples

| Input | purchase_quantity | purchase_unit | item_size | item_unit | item | item_canonical | Other fields |
|-------|-------------------|---------------|-----------|-----------|------|----------------|--------------|
| "pasta" | 1 | st | 1 | st | pasta | pasta | |
| "3 äpplen" | 3 | st | 1 | st | äpplen | äpple | |
| "500 g pasta" | 1 | st | 500 | g | pasta | pasta | |
| "3 500 g pasta" | 3 | st | 500 | g | pasta | pasta | |
| "1.5 l cola" | 1 | st | 1.5 | l | cola | cola | |
| "1 kg bananer" | 1 | st | 1 | kg | bananer | banan | |
| "6-pack öl" | 1 | st | 6 | st | öl | öl | |
| "2 6-pack öl" | 2 | st | 6 | st | öl | öl | |
| "2 burkar krossade tomater" | 2 | burkar | 1 | st | krossade tomater | krossade tomater | |
| "2 flaskor cola 1.5 l" | 2 | flaskor | 1.5 | l | cola | cola | |
| "400 g burk krossade tomater" | 1 | burk | 400 | g | krossade tomater | krossade tomater | |
| "4 mjölk 1.5l" | 4 | st | 1.5 | l | mjölk | mjölk | |
| "grön mjölk" | 1 | st | 1 | st | grön mjölk | mellanmjölk | |
| "2 mjölk grön eko laktosfri" | 2 | st | 1 | st | mjölk grön | mellanmjölk | properties: ["ekologisk", "laktosfri"] |
| "eko mjölk Arla" | 1 | st | 1 | st | mjölk | mjölk | brand: "Arla", properties: ["ekologisk"] |
| "cola Willys 3/50kr" | 1 | st | 1 | st | cola | cola | stores: ["Willys"], offer: {quantity: 3, price: 50, currency: "kr"} |
| "mjölk till lasagnen" | 1 | st | 1 | st | mjölk | mjölk | comment: "till lasagnen" |
| "4 mjölk grön 1.5l eko Willys 4/20kr" | 4 | st | 1.5 | l | mjölk grön | mellanmjölk | properties: ["ekologisk"], stores: ["Willys"], offer: {quantity: 4, price: 20, currency: "kr"} |

---

## Edge Cases

### Multiple offers in input

"cola Willys 3/50kr ICA 2/30kr"

**Behavior:** Take first offer, put rest in comment.
**Output:** stores: ["Willys", "ICA"], offer: {quantity: 3, price: 50, currency: "kr"}, comment: "2/30kr"

**Rationale:** Single offer is intentional — see GROCERY_ITEM spec design decision #12.

### Ranges and approximations

"2-3 äpplen", "ca 500 g köttfärs"

**Behavior:** Take maximum value.
**Output:** purchase_quantity: 3, item_size: 500

**Rationale:** Better to overbuy than underbuy. Original preserved in original_input.

### Numbers in item names

"7up", "Coca-Cola Zero"

**Behavior:** Recognize as item name, not quantity.
**Implementation:** Item library lookup should happen before number extraction, or use negative lookahead for known brands.

### Unknown container

"2 dunkar olja" (where "dunkar" isn't in DB)

**Behavior:** Fallback to "st".
**Output:** purchase_quantity: 2, purchase_unit: "st", comment: "dunkar"

---

## Design Decisions

### 1. Uniform parser interface

**Decision:** Both parsers accept `Partial<GroceryItem> & { original_input: string }`.

**Rationale:**
- Enables re-parsing and enrichment of existing items
- Allows flexible parser chaining (manual → AI or AI → manual)
- Supports re-validation when DB vocabulary updates
- Single interface simplifies orchestration

### 2. Manual parser first

**Decision:** Always try manual parser before AI parser.

**Rationale:**
- Performance — manual parser is fast and deterministic
- Cost — AI parser has API costs
- Predictability — same input always produces same output from manual parser

### 3. Preserve over overwrite

**Decision:** When given partial input, preserve provided values unless explicitly re-parsing.

**Rationale:**
- User corrections should stick
- Avoids undoing manual edits
- Re-parsing should be explicit action, not default

### 4. Comment as escape hatch

**Decision:** Unparsed tokens go to comment, not discarded.

**Rationale:**
- No data loss
- User can see what wasn't understood
- AI parser can use comment content as additional context
- User notes naturally end up in comment ("till lasagnen")
