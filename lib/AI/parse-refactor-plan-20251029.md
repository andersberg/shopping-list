🧩 Summary: Two-Phase Parsing Architecture for Grocery Input (LLM + Backend)

🎯 Goal

Build a robust and cost-efficient parsing pipeline that converts free-form
Swedish grocery phrases (e.g. “2 pkt ekologisk mjölk från Ica”) into structured
JSON data matching the internal schema. The current single-prompt approach works
well but is approaching complexity limits for the chosen model (Llama 3.1
8B-Instruct on Cloudflare AI).

⸻

🧠 Reasoning and Model Constraints

Problem •	The current prompt is large and includes many intertwined rules
(quantity vs size logic, category mapping, brand/store/organic detection, etc.).
•	The 8 B parameter model performs well up to ~2 000–3 000 tokens, but beyond
that, its ability to follow all hierarchical rules begins to degrade. •	Recent
test runs show high accuracy (~90 %) but recurring pattern errors: •	Mixing
quantity and size. •	Confusing store vs brand. •	Dropping or mis-categorizing
common grocery items.

Insight

These are not linguistic failures — they stem from prompt overload. The model
must both extract, reason, and normalize simultaneously. To improve precision,
we split these cognitive tasks.

⸻

🧩 Proposed Solution: Two-Phase Architecture

Phase 1: Extraction Pass (“identify, don’t interpret”)

A lightweight prompt whose sole goal is to detect tokens (numbers, units,
brands, stores, modifiers, uncertain words, etc.) without applying rules or
math.

Example output:

{ "raw_item": "mjölk", "raw_numbers": ["2"], "raw_units": ["pkt"],
"raw_pack_words": ["pkt"], "raw_brand_candidates": ["Arla"],
"raw_store_candidates": ["Ica"], "raw_modifiers": ["ekologisk"], "organic_flag":
true, "uncertain_phrases": [], "original": "2 pkt ekologisk mjölk från Ica" }

Key principle: This step should be extremely short (< 500 tokens) so that even a
small model (8 B) produces consistent, lossless tokenization. No reasoning, no
math, no validation.

⸻

Phase 2: Normalization Pass (“interpret and validate”)

This can run either: •	in backend code (preferred), or •	via a smaller follow-up
prompt using the same or cheaper model.

It takes the raw output and applies deterministic rules: •	Category mapping
•	Quantity vs size disambiguation •	Unit normalization •	Brand/store resolution
•	Canonical total computation (total_value, total_unit) •	Fallbacks for
uncertain phrases (“några”, “ungefär”, “lite”)

Example pseudocode:

function normalize(raw, domain) { const item = normalizeItem(raw.raw_item);
const brand = pickFirst(raw.raw_brand_candidates.filter(inList(domain.brands)));
const store_raw = pickFirst(raw.raw_store_candidates); const store_normalized =
normalizeStore(store_raw, domain.stores);

const { quantity, quantity_unit, size_value, size_unit } =
inferQuantityAndSize(raw); const { total_value, total_unit } =
toCanonical(quantity, quantity_unit, size_value, size_unit);

const category = inferCategory(item, domain.categories);

return { item, category, quantity, quantity_unit, size_value, size_unit, brand,
organic: raw.organic_flag, comment: joinComments(raw.uncertain_phrases,
raw.raw_modifiers), unit_normalized: size_unit ?? null, total_quantity_value:
total_value, total_quantity_unit: total_unit, store_normalized, store_raw,
status: "ok" }; }

⸻

🧮 Schema Simplification Philosophy

Original issue

The previous schema had both quantity and size, which sometimes confused the
model.

Decision

Keep both internally, but treat them as intermediate fields. All downstream
systems should rely on a single canonical representation:

Field	Purpose total_quantity_value	Unified numeric value for
display/sorting/summing total_quantity_unit	Unified unit (g/kg/ml/l/st) quantity
/ quantity_unit	Optional: number of packages (2 pkt, 1 burk, etc.) size_value /
size_unit	Optional: per-package size (500 g, 1 l, etc.)

This separation allows future extensions (offers, pricing per unit, etc.)
without overloading the base model.

⸻

💡 Advantages

Aspect	Before (Single Prompt)	After (Two-Phase Flow) Prompt size	Large (~2–3 k
tokens)	Small per phase (< 600 tokens) Reasoning load	Extraction + Normalization
mixed	Clearly separated LLM determinism	Medium, sometimes inconsistent	High,
consistent Maintenance	Complex rule updates	Backend-controlled
Cost/latency	Single call, larger context	Two smaller calls, still cheaper
overall Future flexibility	Hard-coded categories	Dynamic per-domain lists

⸻

🏗️ Implementation Notes •	Phase 1 prompt can run on
@cf/meta/llama-3.1-8b-instruct for speed. •	Phase 2 can run either: •	as pure
backend code, or •	with a smaller prompt for uncertain rows (category:null →
repair pass). •	Domain lists (units, categories, stores, brands) should be
passed explicitly to normalization logic. •	Long-term: only regenerate Phase 1
if input schema changes; Phase 2 can evolve independently.

⸻

✅ Summary for Implementing Agent

Implement a two-phase grocery-parser pipeline where Phase 1 performs pure
extraction of raw lexical tokens (no reasoning), and Phase 2 applies
deterministic normalization rules to produce final structured data. Keep both
quantity and size fields for internal flexibility, but always compute a
canonical total_quantity_value + total_quantity_unit pair for external
consumers. This split is chosen because the current LLM model (Llama 3.1 8B)
reaches its reasoning limit when combining extraction + interpretation in a
single prompt. The modular architecture ensures higher precision, easier
maintenance, and predictable behavior even with small or cheaper models.
