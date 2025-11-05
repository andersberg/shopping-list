# Two-Phase Parser Audit (2025-10-29)

## 1. Current `/api/parse` Flow
- `lib/api/index.ts` exposes `POST /api/parse`.
- The handler builds a single XML prompt via `lib/AI/GroceryInputParser/prompts/prompt-builder.ts`.
- Domain lists injected: `CATEGORY_NAMES`, `QUANTITY_UNITS`, `SIZE_UNITS`, `BRAND_NAMES`, `STORE_NAMES`.
- Cloudflare AI run: model `@cf/meta/llama-3.1-8b-instruct-fast`.
- The Worker requests a JSON-schema constrained response (`GroceryItemSchema_as_json_schema`) and returns the raw model output unmodified.
- No intermediate parsing/repair logic; prompt carries most normalization rules.

## 2. Prompt-Embedded Logic (Single Pass)
- Quantity vs. size heuristics (`quantity_rules`, `container_rules`).
- Category hints, including overrides for frequent items.
- Item normalization (singularization, brand stripping, comment handling).
- Organic detection, vague phrase handling, unit normalization, comment exclusions.
- Examples encode expected schema ordering and edge-case behavior; prompt length and rule density currently high.

## 3. Shared Contracts & Schemas
- `GroceryItemSchema` (Zod) mirrors the expected model output: quantity, quantity_unit, size_value/size_unit, total_quantity fields, brand/store metadata, offer placeholders.
- Canonical enums come from the files in `lib/AI/GroceryInputParser/*.ts` (single source for categories, units, brands, stores).
- Client-side legacy parser (`lib/GroceryInputParser/Parser.ts`) still feeds the UI forms; it shares types (`ParsedGroceryItem`) with the client but is separate from the Cloudflare AI flow.

## 4. Downstream Dependencies
- Client web app: uses `GroceryInputParser` (legacy) for quick parsing before sending to `/api/grocery-list/items/add`.
- Database schema (`lib/db/schema.ts`) expects validated items: quantity ≥ 1, comment optional, discount price optional.
- No consumer currently depends directly on `/api/parse`, but logs (`logs/*.json`) show it is under active testing for future integration.

## 5. Two-Phase Interfaces (Proposed)
```ts
// Payload sent to Phase 1 (LLM extraction)
interface ExtractionPayload {
  text: string;
  hints: {
    unit_words: string[];
    brand_list: string[];
    store_list: string[];
  };
}

// Strict output from Phase 1
interface ExtractionResult {
  raw_item: string | null;
  raw_numbers: string[];
  raw_units: string[];
  raw_pack_words: string[];
  raw_brand_candidates: string[];
  raw_store_candidates: string[];
  raw_modifiers: string[];
  uncertain_phrases: string[];
  organic_flag: boolean;
  original: string;
}

// Final normalized object returned by Phase 2
interface NormalizedGroceryItem {
  item: string | null;
  category: string | null;
  quantity: number;
  quantity_unit: string | null;
  size_value: number;
  size_unit: string | null;
  brand: string | null;
  organic: boolean;
  comment: string | null;
  unit_normalized: string | null;
  total_quantity_value: number;
  total_quantity_unit: string | null;
  store_normalized: string | null;
  store_raw: string | null;
  offer_quantity: number;
  offer_total_price_value: number;
  offer_currency: string | null;
  offer_unit_price_value: number;
  status: "ok" | "error";
  error: string | null;
}
```

## 6. Migration Notes
- Phase 1 prompt can be ~400–600 tokens: enforce “no reasoning” rules, focus on token extraction.
- Phase 2 should move deterministic logic (unit conversion, category mapping, total computation) into TypeScript modules under `lib/parser/`.
- Maintain Zod validation on both Phase 1 (ExtractionResult) and Phase 2 (NormalizedGroceryItem) to catch malformed data early.
- Client integration plan: eventually replace/augment the local parser with the two-phase service once the normalization pipeline is solid and latency validated.
