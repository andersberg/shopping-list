# Phase 1 AI Extraction Audit

Simple test runner that calls the Cloudflare AI API directly to validate grocery item extraction.

## Setup

Set your Cloudflare credentials as environment variables:

```bash
export CLOUDFLARE_ACCOUNT_ID=your_account_id
export CLOUDFLARE_API_TOKEN=your_api_token
```

## Running Tests

From the repository root:

```bash
pnpm --filter lib audit:phase1
```

Or directly with tsx:

```bash
tsx lib/api/audit/run-phase1-tests.ts
```

## How It Works

1. Reads test cases from `audit-test-cases.ts`
2. For each test case:
   - Creates a prompt using `create_token_extraction_prompt()`
   - Calls Cloudflare AI API directly (no server required)
   - Parses and validates the JSON response
   - Compares actual vs expected values for Phase 1 fields
3. Reports pass/fail/error for each test
4. Prints summary with counts

## Test Output

```
🧪 Running Phase 1 AI Extraction Tests
📦 32 test cases

  basic-organic-milk ... ✅ pass
  weight-based-potato ... ✅ pass
  countable-eggs ... ❌ fail
      raw_qty: expected "6", got null
  ...

📊 Summary:
   ✅ 28 passed
   ❌ 3 failed
   ⚠️  1 errors
```

## Phase 1 Fields

Tests compare these extracted fields:
- `raw_text` - Original input text
- `raw_item` - Item name
- `raw_qty` - Quantity number
- `raw_unit` - Quantity unit
- `raw_brand` - Brand name
- `raw_modifiers` - Descriptive modifiers array
- `raw_offer` - Offer text
- `raw_size_value` - Size/weight value
- `raw_size_unit` - Size/weight unit
- `raw_comment` - Additional comment

## Adding Test Cases

Edit `audit-test-cases.ts` and add new entries to `AUDIT_TEST_CASES`:

```typescript
{
  id: "my-test-case",
  description: "What this test validates",
  input: "2 paket mjölk",
  expected: {
    raw_text: "2 paket mjölk",
    raw_item: "mjölk",
    raw_qty: "2",
    raw_unit: "paket",
    // ... other fields
  },
}
```
