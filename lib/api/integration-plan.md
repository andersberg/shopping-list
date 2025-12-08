# Manual Parser Integration Plan

## Goal
Integrate `ManualParser` into `lib/api/index.ts` as the primary parsing method, falling back to the existing AI implementation only when necessary.

## Steps

1.  **Import Manual Parser**:
    - Add `import { parse_grocery_line } from "../GroceryInputParser/ManualParser";` to `lib/api/index.ts`.

2.  **Modify POST /parse Endpoint**:
    - Inside the handler:
        1.  Call `const manual_result = parse_grocery_line(input);`
        2.  Check `manual_result.status`.
        3.  **If "ok"**:
            - Log success: `console.log("Manual parser success:", manual_result);`
            - Return `c.json(manual_result);` immediately.
        4.  **If not "ok"**:
            - Log fallback: `console.log("Manual parser partial/failed, falling back to AI. Status:", manual_result.status);`
            - Proceed with the existing AI execution code.

3.  **Verification**:
    - Since this is a modification of the live API logic, we should verify it doesn't break the build.
    - We can manually test via `pnpm server:dev` later if needed, or rely on existing types to ensure safety.
