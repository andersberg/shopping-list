# GROCERY_ITEM Data Model Implementation Plan

## Purpose

This document outlines the plan to implement the new `GROCERY_ITEM` data model as defined in `GROCERY_ITEM_parsed_model_spec_01.md`. The goal is to refactor the existing Zod schemas and constants to align with the new two-dimensional quantity model and the static vs. dynamic vocabulary architecture.

---

## Overview of Changes

The implementation will replace the current ambiguous model with a robust, future-proof design that separates:
- **Purchase Intent** (`purchase_quantity` + `purchase_unit`)
- **Item Specification** (`item_size` + `item_unit`)

It also introduces Zod Branded Types for dynamic vocabularies (stores, brands, etc.) to allow for database-driven growth without code changes.

---

## Step 1: Refactor `lib/constants.ts` ✅ COMPLETED

### 1.1. Define Static Enum for Size Units ✅
- **Action:** Update `SIZE_UNITS` to strictly match the specification.
- **Values:** `["mg", "g", "hg", "kg", "ml", "cl", "dl", "l", "st"]`
- **Rationale:** These are static enums used for business logic (conversion, aggregation).

### 1.2. Rename and Define Reference Lists ✅
- **Action:** Rename and define the following lists for parser detection.
- **Changes:**
  - `QUANTITY_UNITS` → `CONTAINER_UNITS` (e.g., "burkar", "flaskor", "paket")
  - `MODIFIERS` → `PROPERTY_NAMES` (e.g., "ekologisk", "laktosfri")
- **Rationale:** These are dynamic vocabularies that will be validated against the DB at runtime.

### 1.3. Remove Backward Compatibility ✅
- **Action:** Removed aliases for renamed constants to ensure clean break with legacy model.
- **Changes:** Eliminated `QUANTITY_UNITS`, `MODIFIERS` aliases and their type exports.
- **Rationale:** Forces explicit use of new naming conventions and prevents confusion between old and new models.

---

## Step 2: Rewrite `lib/grocery-item.ts` ✅ COMPLETED

### 2.1. Define Zod Branded Types ✅
- **Action:** Implement the following branded types as per the spec.
- **Types:**
  ```typescript
  const ContainerUnit = z.string().brand<"ContainerUnit">();
  const Store = z.string().brand<"Store">();
  const Brand = z.string().brand<"Brand">();
  const Property = z.string().brand<"Property">();
  const ItemCanonical = z.string().brand<"ItemCanonical">();
  const Category = z.string().brand<"Category">();
  ```
- **Rationale:** Provides type safety without hardcoding enum values, allowing DB-driven growth.

### 2.2. Implement New `grocery_item_full_schema` ✅
- **Action:** Completely replace the existing `grocery_item_full_schema` with the new definition.
- **Key Fields:**
  - `original_input: string`
  - `item: string`
  - `item_canonical: ItemCanonical | null`
  - `purchase_quantity: number` (default: 1)
  - `purchase_unit: ContainerUnit` (default: "st")
  - `item_size: number` (default: 1)
  - `item_unit: SizeUnit` (default: "st")
  - `stores: Store[]` (default: [])
  - `offer: Offer | null`
  - `brand: Brand | null`
  - `properties: Property[]` (default: [])
  - `category: Category | null`
  - `parse_status: z.enum(["success", "partial", "error"])`
  - `parse_source: z.enum(["manual", "ai"])`
  - `comment: string | null`
  - `parse_error: string | null`
- **Rationale:** This schema strictly follows the architect's specification.

### 2.3. Clean Up Legacy Fields ✅
- **Action:** Remove or deprecate fields from the old schema that conflict with the new model.
- **Examples:** `quantity_unit`, `size_value`, `store_raw`, `store_normalized`, `organic`.
- **Rationale:** Ensures the model is clean and unambiguous, preventing confusion between old and new fields.

### 2.4. Update Exported Types ✅
- **Action:** Ensure `GroceryItem` type is inferred from the new `grocery_item_full_schema`.
- **Rationale:** Guarantees type safety across the application.

---

## Step 3: Handle Downstream Impact (Post-Implementation)

### 3.1. Parser Updates
- **Expected Impact:** The parsers in `lib/parsers/` will have type errors as they expect the old model.
- **Next Step:** Update the parsers to produce the new `GroceryItem` structure. This is a separate task.

### 3.2. API and Client Updates
- **Expected Impact:** Any code consuming `GroceryItem` (e.g., API, client) will need to be updated to handle the new field names and types.
- **Next Step:** Refactor consuming code to use the new model structure.

---

## Validation of Implementation

✅ **Completed:**
1.  The data model in `lib/grocery-item.ts` is a 1:1 match with the specification.
2.  `lib/constants.ts` provides clear separation between static enums and dynamic reference lists.
3.  The codebase is ready for a future where dynamic vocabularies are managed in a database.
4.  All type errors related to the old model are resolved in `lib/grocery-item.ts`.

---

## Files Modified

- ✅ `lib/constants.ts` - Refactored with new naming and removed backward compatibility
- ✅ `lib/grocery-item.ts` - Implemented new data model with branded types and clean schema

---

## Status

- **Status:** ✅ FOUNDATION COMPLETE - Steps 1-2 implemented successfully.
- **Next:** Step 3 - Handle downstream impact (parsers, API, client updates).
- **Dependencies:** None. This is a foundational change.