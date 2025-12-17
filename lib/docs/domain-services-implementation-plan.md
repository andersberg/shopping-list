# Phase 2: Domain Services Extraction - Implementation Plan

## Overview
Extract 8 domain service groups from `lib/parsers/shared/parser-utils.ts` into a new `lib/domain/grocery-item-services.ts` file with a Status-based error handling approach.

## File Structure
```
lib/domain/
├── grocery-item-services.ts    # New file with all domain services
├── constants.ts               # Existing (contains BRAND_NAMES, STORE_NAMES, etc.)
├── grocery-item.ts           # Existing domain model
├── value-objects.ts          # Existing factory functions
└── types.ts                  # Existing type definitions
```

## Error Handling Design (Option D - Status-based)

```typescript
// lib/domain/grocery-item-services.ts

interface DomainResult<T> {
  data: T | null;
  status: "success" | "warning" | "error";
  message?: string;
}

// Helper functions for creating results
function createSuccess<T>(data: T): DomainResult<T> {
  return { data, status: "success" };
}

function createWarning<T>(data: T | null, message: string): DomainResult<T> {
  return { data, status: "warning", message };
}

function createError<T>(message: string): DomainResult<T> {
  return { data: null, status: "error", message };
}
```

## Data Structures to Move

From `parser-utils.ts` to domain services:

```typescript
// Item dictionary for canonical mapping
const ITEM_DICTIONARY: Record<string, { canonical: string; category: string }> = {
  mjölk: { canonical: "mjölk", category: "mejeri" },
  grädde: { canonical: "grädde", category: "mejeri" },
  smör: { canonical: "smör", category: "mejeri" },
  ägg: { canonical: "ägg", category: "mejeri" },
  yoghurt: { canonical: "yoghurt", category: "mejeri" },
  fil: { canonical: "fil", category: "mejeri" },
  tomat: { canonical: "tomat", category: "frukt & grönt" },
  tomater: { canonical: "tomat", category: "frukt & grönt" },
  gurka: { canonical: "gurka", category: "frukt & grönt" },
  banan: { canonical: "banan", category: "frukt & grönt" },
  äpple: { canonical: "äpple", category: "frukt & grönt" },
  äpplen: { canonical: "äpple", category: "frukt & grönt" },
  potatis: { canonical: "potatis", category: "frukt & grönt" },
  lök: { canonical: "lök", category: "frukt & grönt" },
  morot: { canonical: "morot", category: "frukt & grönt" },
  morötter: { canonical: "morot", category: "frukt & grönt" },
  pasta: { canonical: "pasta", category: "skafferi" },
  spaghetti: { canonical: "spaghetti", category: "skafferi" },
  spagetti: { canonical: "spaghetti", category: "skafferi" },
  ris: { canonical: "ris", category: "skafferi" },
  olja: { canonical: "olja", category: "skafferi" },
  olivolja: { canonical: "olivolja", category: "skafferi" },
  "krossade tomater": { canonical: "krossade tomater", category: "skafferi" },
  kikärtor: { canonical: "kikärtor", category: "skafferi" },
  bönor: { canonical: "bönor", category: "skafferi" },
  jäst: { canonical: "jäst", category: "skafferi" },
  tonfisk: { canonical: "tonfisk", category: "fisk & skaldjur" },
  lax: { canonical: "lax", category: "fisk & skaldjur" },
  sill: { canonical: "sill", category: "fisk & skaldjur" },
  ärtpor: { canonical: "ärtpor", category: "fryst" },
  glass: { canonical: "glass", category: "fryst" },
  blöjor: { canonical: "blöjor", category: "hygien" },
};

// Unit normalization mapping
const UNIT_NORMALIZATION: Record<string, string> = {
  paket: "pkt",
  förp: "fp",
  förpackning: "fp",
  burk: "burk",
  flaska: "flaska",
  st: "st",
  stycken: "st",
  kg: "kg",
  g: "g",
  l: "l",
  dl: "dl",
  cl: "cl",
  ml: "ml",
};

// Organic detection tags
const ORGANIC_TAGS = [
  "eko",
  "ekologisk",
  "ekologiska",
  "organic",
  "krav",
];
```

## Service Groups to Extract

### A. Text Normalization Service
```typescript
export function normalize_string(input: string | null): DomainResult<string | null>
export function normalize_decimal(input: string | null): DomainResult<number>
```

### B. Item Classification Service
```typescript
export function canonicalize_item(item: string | null): DomainResult<{
  canonical: string | null;
  category: string | null;
}>

export function map_item_to_category(item: string | null): DomainResult<string | null>
```

### C. Unit Management Service
```typescript
export function normalize_unit(unit: string | null): DomainResult<string | null>
```

### D. Brand Processing Service
```typescript
export function normalize_brand(brand: string | null): DomainResult<string | null>
```

### E. Offer Analysis Service
```typescript
export function parse_offer(offer: string | null): DomainResult<{
  quantity: number;
  price: number;
  currency: string;
}>
```

### F. Store Detection Service
```typescript
export function extract_store_from_text(text: string): DomainResult<{
  store_normalized: string | null;
  store_raw: string | null;
}>
```

### G. Property Detection Service
```typescript
export function extract_organic(modifiers: string[]): boolean
// Future: extract_lactose_free(), extract_gluten_free(), etc.
```

### H. Business Rules Service
```typescript
export function apply_default_quantity(
  item: string | null,
  quantity: number,
  quantity_unit: string | null,
  size_value: number
): DomainResult<{ quantity: number; quantity_unit: string | null }>

export function determine_parse_status(
  item: string | null,
  category: string | null,
  has_errors: boolean
): "success" | "partial" | "error"
```

## Implementation Details

### Singularization Logic
```typescript
function apply_singularization_rules(item: string): string {
  if (item.endsWith("er") && item.length > 2) {
    return item.slice(0, -2);
  } else if (item.endsWith("ar") && item.length > 2) {
    return item.slice(0, -2);
  } else if (item.endsWith("or") && item.length > 2) {
    return item.slice(0, -2);
  }
  return item;
}
```

### Currency Handling
```typescript
function parse_currency(currency_string: string): "kr" | "sek" {
  const normalized = currency_string.toLowerCase();
  return normalized.includes("sek") ? "sek" : "kr";
}
```

## Dependencies & Imports

```typescript
// Imports needed in grocery-item-services.ts
import { BRAND_NAMES, STORE_NAMES, CATEGORY_NAMES, CURRENCIES } from "./constants";
import type { CategoryName, BrandName, StoreName, Currency } from "./constants";
```

## Test Strategy

### File: `lib/domain/grocery-item-services.test.ts`

### Test Coverage
- Each service function with valid/invalid inputs
- Edge cases (null, empty strings, unicode)
- Business logic (singularization, offer parsing)
- Error handling scenarios
- Data dictionary lookups
- Status/message combinations

### Test Structure
```typescript
describe("Text Normalization Service", () => {
  describe("normalize_string", () => {
    it("should normalize basic text", () => { /* ... */ });
    it("should handle null input", () => { /* ... */ });
    it("should handle unicode characters", () => { /* ... */ });
  });
});

// Similar structure for each service group
```

## Migration Path

1. **Create new services file** without touching existing parsers
2. **Add comprehensive tests** for all services
3. **Verify services work** with existing data patterns
4. **Legacy parsers can be updated later** (Phase 3)

## Key Benefits of This Approach

✅ **Pure Business Logic:** No infrastructure dependencies
✅ **Testable in Isolation:** Each function can be unit tested
✅ **Reusable:** Services can be used by any parser implementation  
✅ **Type Safety:** Full TypeScript support with domain types
✅ **Error Context:** Rich error information for debugging
✅ **Backward Compatible:** Doesn't break existing parsers
✅ **Data Co-location:** Related data structures live with the services that use them

## Files to Create/Modify

### New Files:
- `lib/domain/grocery-item-services.ts` (main services)
- `lib/domain/grocery-item-services.test.ts` (tests)

### Files to Reference:
- `lib/domain/constants.ts` (existing constants)
- `lib/domain/types.ts` (existing types)
- `lib/parsers/shared/parser-utils.ts` (source of business logic)

### Files NOT to Touch:
- Legacy parser files (as requested)
- Client code
- Database schemas

## Implementation Order

1. Create the main services file with all functions
2. Create comprehensive test suite
3. Run tests to verify implementation
4. Document usage patterns
5. Ready for Phase 3 (legacy parser migration)