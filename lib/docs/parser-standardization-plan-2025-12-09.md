# Parser Standardization & Folder Structure Implementation Plan

**Date**: 2025-12-09  
**Status**: In Progress  

## Overview

This plan implements both parser standardization and folder structure reorganization to create a unified, maintainable parsing system with two interchangeable parsers (manual and AI) that produce identical output.

## Goals

1. **Unified Interface**: Both parsers implement `GroceryParser` interface
2. **Identical Output**: Same input → same `GroceryItem` regardless of parser
3. **Shared Business Logic**: Eliminate duplication between parsers
4. **Clean Architecture**: Clear separation of concerns
5. **Preserved Debugging**: Maintain audit system and debugging capabilities
6. **Comprehensive Testing**: Aligned test cases for both parsers

## New Folder Structure

```
lib/
├── parsers/                    # NEW - All parsing logic
│   ├── shared/
│   │   ├── parser-interface.ts   # GroceryParser interface
│   │   ├── parser-utils.ts      # Shared business logic
│   │   └── test-cases.ts       # Aligned test cases
│   ├── manual/
│   │   ├── manual-parser.ts    # Refactored manual parser
│   │   ├── manual-parser.test.ts
│   │   └── fixtures.ts
│   ├── ai/
│   │   ├── ai-parser.ts       # NEW - Unified AI parser class
│   │   ├── token-mapper.ts    # Refactored token mapper
│   │   └── prompts/
│   │       └── token-extraction-prompt.ts
│   └── index.ts
├── ai/                        # EXISTING + audit moved here
│   ├── ai-response-parser.ts
│   ├── store-names.ts
│   └── audit/                 # MOVED from api/audit/
│       ├── audit-test-cases.ts
│       ├── diff-engine.ts
│       ├── console-reporter.ts
│       └── run-phase1-tests.ts
└── [existing folders unchanged for reference]
```

## Implementation Phases

### Phase 1: Foundation - Create Structure & Shared Logic

#### 1.1 Create Folder Structure
- Create `parsers/` directory structure
- Move `audit/` from `api/` to `ai/`
- Copy necessary files to new locations

#### 1.2 Implement Parser Interface
```typescript
// parsers/shared/parser-interface.ts
export interface GroceryParser {
  parse(input: string): GroceryItem | Promise<GroceryItem>;
  readonly source: "manual" | "ai";
}
```

#### 1.3 Extract Shared Business Logic
From `lib/api/token-mapper.ts` to `parsers/shared/parser-utils.ts`:
- `ITEM_DICTIONARY`
- `map_item_to_canonical()`
- `map_item_to_category()`
- `normalize_string/decimal/unit()`
- `parse_offer()`
- `extract_organic()`
- `apply_default_quantity()`
- `determine_status()`
- `extract_store_from_text()`

#### 1.4 Create Aligned Test Cases
Copy all test cases from `lib/api/audit/audit-test-cases.ts` to `parsers/shared/test-cases.ts`
Add expected `GroceryItem` output for manual parser tests.

### Phase 2: Manual Parser Refactoring

#### 2.1 Copy and Refactor Manual Parser
- Copy `lib/grocery-input-parser/manual-parser.ts` to `parsers/manual/manual-parser.ts`
- Update imports to use shared utilities
- Implement `GroceryParser` interface
- Replace inline logic with shared utility functions

#### 2.2 Update Manual Parser Tests
- Copy test file to new location
- Update imports to use shared test cases
- Expect standardized `GroceryItem` output with categories, stores, defaults

#### 2.3 Copy Fixtures
- Copy `lib/grocery-input-parser/fixtures.ts` to new location

### Phase 3: AI Parser Implementation

#### 3.1 Create Unified AI Parser Class
Create `parsers/ai/ai-parser.ts` implementing `GroceryParser` interface:
- Wrap existing `parse_ai_response()` and `map_tokens_to_grocery_item()` functions
- Handle errors consistently
- Provide clean interface for API usage

#### 3.2 Copy and Refactor Token Mapper
- Copy `lib/api/token-mapper.ts` to `parsers/ai/token-mapper.ts`
- Update imports to use shared utilities
- Apply standardized business logic

#### 3.3 Copy Prompt File
- Copy `lib/ai/grocery-input-parser/prompts/token-extraction-prompt.ts`
- Update imports as needed

### Phase 4: Test Alignment & Integration

#### 4.1 Update Manual Parser Tests
- Use shared test cases with expected `GroceryItem` output
- Verify standardized behavior (categories, stores, defaults, status)

#### 4.2 Update AI Audit System
- Update imports to new audit location
- Add comparison to expected `GroceryItem` output (logged, not failing)
- Ensure audit functionality preserved

#### 4.3 Create Parser Index
- Create `parsers/index.ts` to export all parsers
- Provide clean import interface for API

### Phase 5: API Integration

#### 5.1 Update Parse Endpoint
- Update `lib/api/index.ts` to import from new parsers
- Implement clean two-phase parsing using unified interface
- Remove old parsing logic

#### 5.2 Update All Import References
- Update any other files importing old locations
- Ensure all imports point to new structure

## Standardization Requirements

### Both Parsers Must Handle:
1. **Categories**: Populate when known, null otherwise
2. **Stores**: Extract from text when present
3. **Default Quantity**: Apply `quantity: 1, unit: "st"` for simple items
4. **Status Logic**: Use consistent criteria for `ok`/`needs_review`/`parse_error`
5. **Item Canonicalization**: Map to same canonical forms
6. **Error Handling**: Return consistent error GroceryItem format

### Expected Identical Output:
For input `"3 pkt 1,5l mjölk eko arla 4/50kr ica"`:
```typescript
{
  item: "mjölk",
  category: "mejeri",
  quantity: 3,
  quantity_unit: "pkt",
  size_value: 1.5,
  size_unit: "l",
  brand: "Arla",
  organic: true,
  store_normalized: "ica",
  store_raw: "ica",
  offer_quantity: 4,
  offer_total_price_value: 50,
  offer_currency: "SEK",
  offer_unit_price_value: 12.5,
  total_quantity_value: 4.5,
  total_quantity_unit: "l",
  status: "ok",
  error: null,
  source: "manual" | "ai",
  // ... other fields
}
```

## Testing Strategy

### Manual Parser Tests
- Deterministic assertions with expected `GroceryItem` output
- Use shared test cases
- Verify all standardized behavior

### AI Parser Audit
- Non-deterministic audit system preserved
- Compare to expected `GroceryItem` output (logged)
- Maintain existing debugging capabilities

### Integration Tests
- Verify two-phase parsing works correctly
- Test fallback behavior
- Ensure API integration functions properly

## Risk Mitigation

1. **No Existing Files Modified**: Old structure preserved for review
2. **Gradual Implementation**: Step-by-step verification
3. **Comprehensive Testing**: Test at each phase
4. **Backward Compatibility**: Old imports can be updated gradually
5. **Rollback Capability**: Can revert to old structure if needed

## Success Criteria

1. ✅ Both parsers implement `GroceryParser` interface
2. ✅ Both parsers produce identical `GroceryItem` for same input
3. ✅ All shared business logic extracted to utilities
4. ✅ Tests pass for both parsers
5. ✅ API integration works with new structure
6. ✅ Audit system functionality preserved
7. ✅ No breaking changes to existing functionality

## Implementation Log

### Phase 1 - Foundation
- [x] Create folder structure
- [x] Move audit to ai/
- [x] Implement parser interface
- [x] Extract shared utilities
- [x] Create aligned test cases

### Phase 2 - Manual Parser
- [x] Copy and refactor manual parser
- [x] Update manual parser tests
- [x] Copy fixtures

### Phase 3 - AI Parser
- [x] Create unified AI parser class
- [x] Copy and refactor token mapper
- [x] Copy prompt file

### Phase 4 - Test Alignment & Integration
- [x] Update manual parser tests
- [x] Update AI audit system
- [x] Create parser index

### Phase 5 - Integration
- [x] Update parse endpoint
- [x] Update all import references
- [x] Final testing and verification

---

**Next Step**: Begin Phase 1.1 - Create folder structure and move audit directory.