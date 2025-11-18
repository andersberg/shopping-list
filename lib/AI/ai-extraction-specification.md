# AI Extraction Specification (for Hybrid Grocery Line Parser)

## 1. Purpose

The model’s task is token extraction only — not interpretation or normalization.
It converts a free-text grocery line into a structured set of raw fields that the backend later canonicalizes and validates.
Execution and validation are handled within a Cloudflare Worker using Cloudflare AI and Zod v4.

## 2. Runtime & Model
- Provider: Cloudflare AI (via Workers AI SDK)
- Model: @cf/meta/llama-3.1-8b-instruct
- Deterministic temperature (temperature = 0)
- Streaming disabled

Example invocation:

```ts 
const ai_response = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
  prompt,
  temperature: 0,
});
```

All AI responses must be validated using Zod v4 before any backend logic executes.

## 3. Output Contract (AI → Backend)

Return a single JSON object conforming to the schema below.
Any missing value must be null. Arrays may be empty but never omitted.

```json
{
  "raw_text": "original input line",
  "raw_item": "string | null",
  "raw_qty": "string | null",
  "raw_unit": "string | null",
  "raw_brand": "string | null",
  "raw_modifiers": ["string"],
  "raw_offer": "string | null",
  "raw_size_value": "string | null",
  "raw_size_unit": "string | null",
  "raw_comment": "string | null"
}
```

Zod v4 validation (TypeScript)

```ts
import { z } from "zod";

export const GroceryAiExtractionSchema = z.object({
  raw_text: z.string(),
  raw_item: z.string().nullable(),
  raw_qty: z.string().nullable(),
  raw_unit: z.string().nullable(),
  raw_brand: z.string().nullable(),
  raw_modifiers: z.array(z.string()),
  raw_offer: z.string().nullable(),
  raw_size_value: z.string().nullable(),
  raw_size_unit: z.string().nullable(),
  raw_comment: z.string().nullable(),
});
```

Any AI response failing this validation must be rejected and logged with status: "parse_error".

## 4. Extraction Rules
1.	Do not normalize or translate anything. Copy text as written; backend handles casing, singularization, and canonical mapping.
2.	Do not invent or guess values. If the text lacks a field → output null.
3.	Preserve numeric and textual formatting exactly (e.g., 1,5l vs 1.5l).
4.	Price or offer patterns (containing /, kr, or “för” + number) → copy fully into raw_offer.
5.	Quantity and offer may coexist. Backend decides which to trust.
6.	Per-item size patterns (1,5l, 500g) → split into raw_size_value + raw_size_unit.
7.	If unsure whether a word is a brand or store, put it in raw_brand; backend reclassifies later.
8.	Any remaining words, preferences, flavors, or free-form notes → put into raw_comment.
9.	Output JSON only. No prose, explanations, or extra keys.

## 5. XML Prompt Template

```html
<task>
  <description>
    You extract raw tokens from a single Swedish grocery line.
    You DO NOT normalize, translate, or guess.
    You MUST output ONE JSON object only.
  </description>

  <output-format>
    The JSON object MUST match this structure exactly:

    {
      "raw_text": "string",
      "raw_item": "string | null",
      "raw_qty": "string | null",
      "raw_unit": "string | null",
      "raw_brand": "string | null",
      "raw_modifiers": ["string"],
      "raw_offer": "string | null",
      "raw_size_value": "string | null",
      "raw_size_unit": "string | null",
      "raw_comment": "string | null"
    }
  </output-format>

  <rules>
    <rule>Copy the input line exactly into "raw_text".</rule>
    <rule>If a value is missing in the text, set it to null.</rule>
    <rule>Do NOT invent canonical names or categories.</rule>
    <rule>Keep Swedish words as they are.</rule>
    <rule>Price/offer patterns (like "4/50kr", "3 för 20kr", "4/299 kr") → put the full substring into "raw_offer".</rule>
    <rule>Size patterns (like "1,5l", "1.5l", "500g") → split into "raw_size_value" and "raw_size_unit".</rule>
    <rule>If unsure whether a word is a brand or a store, put it in "raw_brand".</rule>
    <rule>Any remaining words, preferences, flavors, or user notes → put into "raw_comment".</rule>
    <rule>Do NOT output explanations, markdown, or extra keys.</rule>
  </rules>

  <examples>
    <example>
      <input>Tomater eko svenska 4/50kr</input>
      <output>
        {
          "raw_text": "Tomater eko svenska 4/50kr",
          "raw_item": "tomater",
          "raw_qty": null,
          "raw_unit": null,
          "raw_brand": null,
          "raw_modifiers": ["eko", "svenska"],
          "raw_offer": "4/50kr",
          "raw_size_value": null,
          "raw_size_unit": null,
          "raw_comment": null
        }
      </output>
    </example>

    <example>
      <input>3 1.5l mjölk eko</input>
      <output>
        {
          "raw_text": "3 1.5l mjölk eko",
          "raw_item": "mjölk",
          "raw_qty": "3",
          "raw_unit": null,
          "raw_brand": null,
          "raw_modifiers": ["eko"],
          "raw_offer": null,
          "raw_size_value": "1.5",
          "raw_size_unit": "l",
          "raw_comment": null
        }
      </output>
    </example>

    <example>
      <input>Blöjor libero 4/299 kr</input>
      <output>
        {
          "raw_text": "Blöjor libero 4/299 kr",
          "raw_item": "blöjor",
          "raw_qty": null,
          "raw_unit": null,
          "raw_brand": "libero",
          "raw_modifiers": [],
          "raw_offer": "4/299 kr",
          "raw_size_value": null,
          "raw_size_unit": null,
          "raw_comment": null
        }
      </output>
    </example>

    <example>
      <input>1 pkt Sia glass gärna choklad</input>
      <output>
        {
          "raw_text": "1 pkt Sia glass gärna choklad",
          "raw_item": "glass",
          "raw_qty": "1",
          "raw_unit": "pkt",
          "raw_brand": "sia",
          "raw_modifiers": [],
          "raw_offer": null,
          "raw_size_value": null,
          "raw_size_unit": null,
          "raw_comment": "gärna choklad"
        }
      </output>
    </example>
  </examples>

  <instruction>
    Now extract tokens from the following line and output VALID JSON ONLY:
  </instruction>

  <input-line>
    {{USER_INPUT}}
  </input-line>
</task>
```

## 6. Validation & Error Handling
1.	Validate every AI response with the GroceryAiExtractionSchema.
2.	If validation fails → mark as:

```json
{ "status": "parse_error", "raw_text": "..." }
```

and log it for later review.

3.	Do not retry the model automatically; failures are valuable training data.
4.	Backend canonicalization, mapping, and enrichment only occur after successful validation.

## 7. Backend Handling (Post-Validation)
1.	Normalization
    - Lowercase all strings except raw_text.
    - Strip diacritics for matching only (keep originals for display).
    - Collapse whitespace and trim.
    - Normalize decimal separators (1,5 → 1.5).
2.	Mapping
    - Match raw_item and raw_modifiers against internal dictionaries:
    - Item dictionary: canonical name → category
    - Synonyms: user phrasing → canonical item
    - Units, brands, modifiers: fixed lookup lists
    - If quantity is missing but offer contains one, infer quantity = offer_quantity.
    - If raw_comment is present, keep as-is and map to comment in the final object.
    - If raw_offer exists, parse into:
    
```json
{
  "offer_quantity": number,
  "offer_total_price_value": number,
  "offer_currency": "SEK",
  "offer_unit_price_value": number
}
```

3.	Enrichment
    - Derive organic: true if any modifier in ["eko", "ekologisk", "organic"].
    - Compute total_quantity_value = quantity * size_value if both exist.
    - Map brand and store using known lists (store_normalized if match).
4.	Output Object
    - Produce stable, validated schema:

```json
{
  "item": "canonical",
  "quantity": number,
  "unit": "string | null",
  "brand": "string | null",
  "organic": boolean,
  "category": "string | null",
  "offer_quantity": number | 0,
  "offer_total_price_value": number | 0,
  "offer_currency": "SEK | null",
  "offer_unit_price_value": number | 0,
  "comment": "string | null",
  "status": "ok | needs_review | parse_error"
}
```


## 5.	Logging & Review

  - If no match or ambiguous → status: "needs_review".
  - Log payload:

```json
{
  "raw_text": "...",
  "ai_tokens": { ... },
  "normalized_item": "...",
  "comment": "...",
  "timestamp": "ISO string"
}
```
  - Logged rows feed future synonym and dictionary expansion.
