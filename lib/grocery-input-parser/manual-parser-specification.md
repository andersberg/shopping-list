# Manual Parser Specification (for Hybrid Grocery Line Parser)

## 1. Purpose

The manual parser’s task is to deterministically parse a free-text grocery line into the final normalized schema used by the application, without calling an LLM.
- It replaces the AI extraction step for normal usage.
- It uses rules + internal TypeScript lexicons to interpret the line.
- It runs in hybrid mode together with the existing AI extraction:
- Manual parser is the primary path.
- AI may be used as optional fallback or for diagnostics when parsing fails or is partial.

### The parser must be:
- Deterministic (same input → same output).
- Side-effect free (pure function).
- Fast (single pass / few passes over tokens).

---

## 2. Runtime & Integration
- Runtime: TypeScript in a Cloudflare Worker (Hono backend).
- The parser is implemented as a pure function, e.g.:

```ts
parse_grocery_line(input: string): ParsedResult
```


- It does not call any AI models.
- Validation to the final schema is handled with Zod v4 in the backend.

### The manual parser is called:
1.	Directly from the grocery-list parsing API endpoint.
2.	Optionally followed by AI extraction / assistance when status !== "ok".

---

## 3. Input & Output Contract

### 3.1 Input
- input: string

A single grocery line as written by the user, e.g.:
- "3 pkt 1,5l mjölk eko arla 4/50kr ica"
- "tomater eko svenska 4/50kr"
- "1 påse chips sourcream garant willys"

The parser must never throw; all failures must be represented in the returned object.

### 3.2 Output (Final Schema)

The manual parser returns an object that matches the existing Zod schema exactly:

```json
{
  "item": "string",
  "category": "string",
  "quantity": 0,
  "quantity_unit": "string|null",
  "size_value": 0,
  "size_unit": "string|null",
  "brand": "string|null",
  "organic": false,
  "comment": "string|null",
  "unit_normalized": "string|null",
  "total_quantity_value": 0,
  "total_quantity_unit": "string|null",
  "store_normalized": "string|null",
  "store_raw": "string|null",
  "offer_quantity": 0,
  "offer_total_price_value": 0,
  "offer_currency": "string|null",
  "offer_unit_price_value": 0,
  "status": "ok",
  "error": "string|null"
}
```

### Notes:
- All fields must be present.
- status values:
  - "ok" → parsed with high confidence.
  - "partial" → some parts missing or ambiguous; line still usable.
  - "error" → parsing failed; consumer should surface the original text and error.
- Numeric fields:
  - 0 means “not set” / “not known”.
  - Prices and quantities should be positive when set.
- category may be left to a later step (e.g. category mapping) if not inferable in the parser; in that case use a default or “unknown” category agreed with the backend.

---

## 4. Parsing Pipeline Overview

The manual parser is implemented as a pipeline of pure steps:
1.	Pre-normalization
2.	Tokenization
3.	Lexicon annotation
4.	Rule-based interpretation (grammar)
5.	Post-processing & validation

Each step receives a well-typed structure and returns a new one. No step should assume unvalidated external input besides the initial string.

---

## 5. Pre-normalization

Input: `raw string`

Output: `NormalizedInput`

Responsibilities:
- Trim whitespace; collapse multiple spaces → single space.
- Normalize decimal separators:
  - "1,5l", "1,5 l" → "1.5 l".
- Normalize currency:
  - "KR", "kr", ":-" → "kr".
- Preserve the original string separately:
  ```ts
  type NormalizedInput = {
    original_text: string;
    normalized_text: string;
  };
  ```
- Lowercasing:
  - For parsing logic, work on a lowercase copy of normalized_text.
  - Preserve original_text for comment and store_raw.

---

## 6. Tokenization

Input: `NormalizedInput`

Output: `Token[]`

Tokenization splits normalized_text into tokens with basic types:

```ts
type TokenType =
  | "number"
  | "word"
  | "price"
  | "separator";

type Token = {
  text: string;       // original segment as in normalized_text
  type: TokenType;
  index: number;      // position in token array
  start: number;      // char offset (optional)
  end: number;        // char offset (optional)
};
```

### Tokenization rules:
- Numbers: sequences like 3, 1.5, 500.
- Words: alphabetic sequences, e.g. pkt, mjölk, eko, arla, ica.
- Price-like segments:
  - Patterns like 4/50kr, 4/50, 3/20kr, 3 för 20kr, 299kr, 299 kr.
  - Can be a single token of type "price" or multiple tokens (["3", "för", "20kr"]), as long as the grammar step can detect the pattern.
- Separators: punctuation and others (e.g. /, ,) if needed.

The tokenizer must be tolerant to minor spelling/spacing variations that are common in Swedish grocery lines.

---

## 7. Lexicons & Annotation

Input: `Token[]`

Output: `AnnotatedToken[]`

The parser uses internal TypeScript lexicons (plain objects/arrays) to map tokens to domain concepts.

### 7.1 Lexicon Types

Lexicons are defined as constants, for example:

```ts
type ItemLexiconEntry = {
  canonical_item: string;     // e.g. "mjölk"
  synonyms: string[];         // ["mjölk", "mellan mjölk", "standardmjölk"]
};

type UnitLexiconEntry = {
  canonical_unit: string;     // e.g. "package"
  forms: string[];            // ["pkt", "paket", "förp", "pack"]
};

type BrandLexiconEntry = {
  canonical_brand: string;    // e.g. "arla"
  forms: string[];            // ["arla"]
};

type StoreLexiconEntry = {
  canonical_store: string;    // e.g. "ica"
  forms: string[];            // ["ica", "ica maxi", "maxi ica"]
};
```

Similar structures can be used for:
- organic_tags: e.g. ["eko", "ekologisk", "krav"]
- offer_keywords: e.g. ["för"]

Lexicons are implemented as TypeScript constants in the parser module, not external JSON files (for now).

## 7.2 Annotated Tokens

Each token is enriched with zero or more semantic labels:

```ts
type TokenLabel =
  | { kind: "quantity_candidate" }
  | { kind: "size_value_candidate" }
  | { kind: "size_unit_candidate"; canonical_unit: string }
  | { kind: "item_candidate"; canonical_item: string }
  | { kind: "brand_candidate"; canonical_brand: string }
  | { kind: "store_candidate"; canonical_store: string }
  | { kind: "organic_tag" }
  | { kind: "offer_pattern" }  // for tokens that look like offers/prices
  | { kind: "price_value_candidate" };

type AnnotatedToken = Token & {
  labels: TokenLabel[];
};
```

### Annotation rules:
- Numbers near unit words can be both quantity_candidate and size_value_candidate. Disambiguation is handled in the grammar step.
- Words that match unit lexicon forms → size_unit_candidate (or quantity_unit depending on context).
- Words that match item lexicon entries → item_candidate with canonical_item.
- Words that match brand lexicon → brand_candidate.
- Words that match store lexicon → store_candidate.
- Words that match organic tags → organic_tag.
- Price-like tokens (e.g. 4/50kr, 299kr) → offer_pattern and/or price_value_candidate.

Annotation must not resolve conflicts; it only adds labels.

---

## 8. Rule-based Interpretation (Grammar)

Input: `AnnotatedToken[]`

Output: `an intermediate ParsedDraft object.`

### 8.1 ParsedDraft Structure

```ts
type ParsedDraft = {
  item: string | null;
  quantity: number | null;
  quantity_unit: string | null;
  size_value: number | null;
  size_unit: string | null;
  brand: string | null;
  organic: boolean;
  comment: string | null;
  store_normalized: string | null;
  store_raw: string | null;
  offer_quantity: number | null;
  offer_total_price_value: number | null;
  offer_currency: string | null;
};
```

ParsedDraft intentionally mirrors the final schema but allows null values and omits derived fields (category, unit_normalized, total_quantity_*, offer_unit_price_value, status, error).

### 8.2 Rule Order

The grammar applies rules in a fixed sequence:
1.	Offer / price patterns
2.	Quantity + quantity_unit
3.	Size_value + size_unit
4.	Item
5.	Brand
6.	Store
7.	Organic
8.	Comment

Each rule:
- Reads from the annotated tokens.
- Writes to ParsedDraft.
- Avoids overwriting already set fields unless a rule has higher priority.

### 8.3 Offer / Price Rules

#### Examples to handle:
- "4/50kr", "4/50 kr":
  - offer_quantity = 4
  - offer_total_price_value = 50
  - offer_currency = "SEK" (or "kr" → normalized later)
- "3 för 20kr":
  - use pattern number + "för" + price.
- "299kr" with no quantity:
  - treat as unit price if quantity is 1 or unknown.
- It may only fill offer_total_price_value if a quantity pattern (3 för 20) is not present.

#### Ambiguity:
- If it is unclear whether the price is per unit or a bundle:
- prefer interpreting clear N for X patterns.
- otherwise, leave offer_quantity = null and set only offer_total_price_value.

### 8.4 Quantity Rules

#### Typical patterns:
- Leading number:
  - "3 pkt mjölk" → quantity = 3, quantity_unit = "package" (from unit lexicon).
- Lone number:
  - "3 mjölk" → quantity = 3, quantity_unit = null.
- If more than one number is present:
  - The leftmost number before item and not part of an offer/size is preferred as quantity.

### 8.5 Size Rules

#### Patterns:
- number + size_unit_candidate:
  - "1,5l mjölk" → size_value = 1.5, size_unit = "l".
  - "500g pasta" → size_value = 500, size_unit = "g".
- If both quantity and size_value exist:
  - quantity refers to packages/items.
  - size_value/size_unit refers to per-item size.

### 8.6 Item Rules
- Search for item_candidate labels.
- If several candidates:
  - Prefer the one closest to quantity/size tokens.
  - If still ambiguous, pick the leftmost and mark result as partial later.
- If no item_candidate:
  - Try last word not tagged as brand/store/organic/unit.
  - If still none, item = null.

### 8.7 Brand Rules
- Collect all brand_candidate tokens that are:
  - Near the item, or
  - Not clearly a store.
  - Join multi-word brands if needed (e.g. "garant" is simple; multi-word brands can be treated as single phrase if lexicon supports it).

### 8.8 Store Rules
- Use store_candidate labels.
- store_normalized is the canonical store name from lexicon (e.g. "ica", "willys").
- store_raw is the substring from the original text corresponding to the store phrase.

### 8.9 Organic & Comment Rules
- If any organic_tag is present → organic = true.
- comment:
  - Any remaining words not used as quantity/unit/size/item/brand/store/offer can be included in comment (based on original text).
  - Preserve freeform preferences, flavors, or notes, e.g. "gärna choklad", "om mogna".

---

## 9. Post-processing & Validation

Input: `ParsedDraft`

Output: `final schema object.`

### Responsibilities:
1.	Defaulting of nulls and zeros:
  - null numeric fields → 0.
  - null string fields → null (as per schema).
2.	Category:
  - If a category mapping exists (e.g. based on item), apply it.
  - Otherwise use a default category (e.g. "misc" or "unknown"), agreed with the backend.
3.	Unit normalization:
  - unit_normalized:
    - Derived from quantity_unit and/or size_unit using unit lexicon.
4.	Total quantity:
  - total_quantity_value and total_quantity_unit:
  - If both quantity and size_value/size_unit are known, compute:
    - `total_quantity_value = quantity * size_value`
    - `total_quantity_unit = size_unit`
  - If only quantity is known:
    - `total_quantity_value = quantity`
    - `total_quantity_unit = quantity_unit` (or a canonical unit).
5.	Offer unit price:
  - If offer_quantity and offer_total_price_value are set and > 0:
    - offer_unit_price_value = offer_total_price_value / offer_quantity.
  - Otherwise:
    - offer_unit_price_value = 0.
6.	Status & error:
  - status = "ok" if:
    - item is non-null and non-empty, and
    - no hard parsing errors occurred.
  - status = "partial" if:
    - item is found but one or more key fields (e.g. quantity or price) are ambiguous or missing.
  - status = "error" if:
    - no item could be identified, or
    - parsing failed for structural reasons.
  - error:
    - null if status = "ok".
  - Short technical message otherwise, e.g.:
    - "no item candidate found"
    - "ambiguous quantity and size"
    - "offer pattern could not be interpreted".

---

## 10. Hybrid Flow with Existing AI

This specification only covers the manual parser, but it must fit in a hybrid architecture.

Recommended flow:
1.	Call parse_grocery_line(input) → result.
2.	If result.status === "ok":
  - Use it as final.
3.	If result.status !== "ok" (optional behavior, configured by backend):
  - Option A: surface the partial result + original line to the user.
  - Option B: call the existing AI extraction endpoint with:
    - raw_text (original line),
    - optionally, the manual parser’s ParsedDraft for hints.
  - Merge or choose between AI result and manual result according to backend rules.

The manual parser must not depend on the AI or its internal schema; it only needs to conform to the final Zod schema described in section 3.
