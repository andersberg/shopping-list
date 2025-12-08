/**
 * Summary: Bygger XML-prompten för token-extrahering (CF AI + Llama 3.1 8B).
 * @param input Användarens inköpsrad (svenska).
 * @returns Komplett XML-prompt som en sträng.
 */
export function create_token_extraction_prompt(input: string): string {
  const user_input = xml_escape(input);

  return `<task>
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
    <rule>Size patterns (like "1,5l", "1.5l", "500g") WITHOUT a separate quantity → split into "raw_size_value" and "raw_size_unit".</rule>
    <rule>If there is BOTH a quantity AND a size (like "3 1.5l mjölk") → quantity goes to "raw_qty" and size goes to "raw_size_value"/"raw_size_unit".</rule>
    <rule>Organic modifiers (eko, ekologisk, ekologiska, KRAV, organic) → put into "raw_modifiers" array, NOT "raw_brand".</rule>
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
    Now extract tokens from the following line and output VALID JSON ONLY.
    DO NOT use markdown code blocks.
    DO NOT add any explanations.
    Output ONLY the JSON object.
  </instruction>

  <input-line>
    ${user_input}
  </input-line>
</task>`;
}

/**
 * Summary: Escape:ar <, >, & och citattecken i user_input.
 */
export function xml_escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}