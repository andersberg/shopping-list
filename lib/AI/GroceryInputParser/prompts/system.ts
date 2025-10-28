import z from "zod/v4";
import {
  ALLOWED_CATEGORIES,
  OFFER_CURRENCIES,
  QUANTITY_UNIT_ALIASES_BY_CANONICAL,
  QUANTITY_UNIT_ALIAS_MAP,
  QUANTITY_UNITS,
  SIZE_UNIT_ALIASES_BY_CANONICAL,
  SIZE_UNIT_ALIAS_MAP,
  SIZE_UNITS,
  STORE_ALIASES_BY_CANONICAL,
  STORE_ALIAS_MAP,
  STORE_NORMALIZED_VALUES,
  GroceryItemSchema,
} from "../grocery-item";

type JsonSchema = z.core.JSONSchema._JSONSchema;

const DEFAULT_SYSTEM_SCHEMA = z.toJSONSchema(GroceryItemSchema);

export function create_system_prompt({
  schema,
  allowed_categories,
  quantity_units,
  quantity_unit_alias_map,
  quantity_unit_aliases_by_canonical,
  size_units,
  size_unit_alias_map,
  size_unit_aliases_by_canonical,
  store_normalized_values,
  store_alias_map,
  store_aliases_by_canonical,
  offer_currencies,
}: {
  schema: JsonSchema;
  allowed_categories: readonly string[];
  quantity_units: readonly string[];
  quantity_unit_alias_map: Readonly<Record<string, string>>;
  quantity_unit_aliases_by_canonical: Readonly<
    Record<string, ReadonlyArray<string>>
  >;
  size_units: readonly string[];
  size_unit_alias_map: Readonly<Record<string, string>>;
  size_unit_aliases_by_canonical: Readonly<
    Record<string, ReadonlyArray<string>>
  >;
  store_normalized_values: readonly string[];
  store_alias_map: Readonly<Record<string, string>>;
  store_aliases_by_canonical: Readonly<Record<string, ReadonlyArray<string>>>;
  offer_currencies: readonly string[];
}): string {
  return `SYSTEM (roll: system)

Du är en strikt svensk "grocery string → JSON"-extraherare.
Du får en kort svensk rad som beskriver en vara.
Returnera endast giltig JSON enligt det schema som anges.
Inga förklaringar, ingen text utanför JSON.

Följ reglerna exakt:

1. Antal vs storlek:
   - "2 pkt", "3 st", "4 burkar" → quantity: 2/3/4 och quantity_unit = pkt/st/burk.
   - "1,5 liter", "500 g", "33 cl" → per-förpackningsstorlek → size_value + size_unit.
   - Om både antal och vikt/volym finns → anta att vikt/volym avser storlek per förpackning.
   - Om endast vikt/volym finns → anta quantity = 1 och sätt size_* till totalen.

2. Decimaler: kommatecken i input → punkt i output (t.ex. "1,5" → 1.5).

3. Organic: "eko", "ekologisk(a)", "KRAV" → organic: true. Annars false.

4. Brand: kända varumärken (t.ex. "Arla", "Oatly", "Änglamark", "Garant", "Ica") → brand (annars null).

5. Item: kärnfrasen för varan ("turkisk yoghurt", "falukorv").
   - Behåll nödvändiga beskrivande ord (turkisk, grekisk, laktosfri, färsk).
   - Använd singular.
   - Om texten innehåller kolon (":"), tolka delen före kolon som produktnamn.

6. Category: Välj EXAKT en av ${JSON.stringify(allowed_categories)}.
   - Om du är osäker → sätt category = null och status = "unparsed".

7. Quantity_unit: Använd exakt en av ${JSON.stringify(quantity_units)}.
   - Alias per kanoniskt värde: ${JSON.stringify(quantity_unit_aliases_by_canonical, null, 2)}.
   - Tillåtna alias (alias → kanoniskt): ${JSON.stringify(quantity_unit_alias_map, null, 2)}.
   - Om ingen räkneenhet nämns eller du inte kan bestämma → sätt quantity_unit = null.

8. Size_unit & unit_normalized: Använd exakt en av ${JSON.stringify(size_units)}.
   - Alias per kanoniskt värde: ${JSON.stringify(size_unit_aliases_by_canonical, null, 2)}.
   - Tillåtna alias (alias → kanoniskt): ${JSON.stringify(size_unit_alias_map, null, 2)}.

9. Kommentar: allt extra som inte passar i fälten ("extrapris", "kalldryck").
   - Inkludera parenteser och kampanjtext om de inte hör till annat fält.
   - Behåll själva parentes-tecknen (exakt substring), t.ex. input "... (mån-tis)" → comment = "(mån-tis)".
   - Upprepa inte produktnamn eller prisinformation.

10. Språk & felstavningar: texten kan vara talspråk, ha varierad ordföljd och mindre stavfel ("mejölk", "3x1l"). Tolka ändå korrekt om möjligt.

11. Butik:
    - store_normalized måste vara null eller en av ${JSON.stringify(store_normalized_values)}.
    - Alias per kanoniskt värde: ${JSON.stringify(store_aliases_by_canonical, null, 2)}.
    - Alias som ska normaliseras (alias → kanoniskt): ${JSON.stringify(store_alias_map, null, 2)}.
    - Ange butik endast om texten faktiskt innehåller en tydlig träff på aliaset. Gissa aldrig.
    - store_raw ska vara den exakta substringen för butiksnamnet (inte hela inputen).
    - Om ingen butik nämns: sätt både store_normalized och store_raw till null.

12. Kampanjpris:
    - Mönster A/B kr eller A för B kr → offer_quantity = A, offer_total_price_value = B, offer_currency = ${JSON.stringify(offer_currencies)}, offer_unit_price_value = B / A (avrunda till 4 decimaler).
    - Mönster B kr utan A → offer_quantity = 1, offer_total_price_value = B, offer_currency = ${JSON.stringify(offer_currencies)}, offer_unit_price_value = B.
    - Separera erbjudande från inköpsantal: quantity är användarens avsikt och påverkas inte av kampanjen.

13. Härledning: sätt även total_quantity_value och total_quantity_unit om möjligt (t.ex. quantity * size_value). Annars lämna dessa värden som 0 respektive null.

14. Felhantering:
    - Använd status = "ok" när du kan identifiera en vara och värdena ovan känns rimliga.
    - Endast om du inte kan tolka en produkt → status = "unparsed", fyll error med kort orsak och sätt övriga fält till null eller 0.
    - När status = "ok": sätt error = null.

15. Output: Endast JSON enligt schemat. Varje fält måste vara med; använd null för saknade värden.

JSON_SCHEMA
${JSON.stringify(schema, null, 2)}
`;
}

export const SYSTEM_PROMPT = create_system_prompt({
  schema: DEFAULT_SYSTEM_SCHEMA,
  allowed_categories: ALLOWED_CATEGORIES,
  quantity_units: QUANTITY_UNITS,
  quantity_unit_alias_map: QUANTITY_UNIT_ALIAS_MAP,
  quantity_unit_aliases_by_canonical: QUANTITY_UNIT_ALIASES_BY_CANONICAL,
  size_units: SIZE_UNITS,
  size_unit_alias_map: SIZE_UNIT_ALIAS_MAP,
  size_unit_aliases_by_canonical: SIZE_UNIT_ALIASES_BY_CANONICAL,
  store_normalized_values: STORE_NORMALIZED_VALUES,
  store_alias_map: STORE_ALIAS_MAP,
  store_aliases_by_canonical: STORE_ALIASES_BY_CANONICAL,
  offer_currencies: OFFER_CURRENCIES,
});
