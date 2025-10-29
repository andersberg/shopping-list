/**
 * Summary: Bygger XML-prompten för grocery-parsing (CF AI + Llama 3.1 8B).
 * @param input Användarens inköpsrad (svenska).
 * @param domain Listor som injiceras (single source of truth i backend).
 * @returns Komplett XML-prompt som en sträng.
 */
export function prompt_builder(
  input: string,
  domain: {
    categories: ReadonlyArray<string>;
    quantity_units: ReadonlyArray<string>;
    size_units: ReadonlyArray<string>;
    brands: ReadonlyArray<string>;
    stores: ReadonlyArray<string>;
  },
): string {
  const categories_string = domain.categories.join(", ");
  const brands_string = domain.brands.join(", ");
  const quantity_units_string = domain.quantity_units.join(", ");
  const size_units_string = domain.size_units.join(", ");
  const stores_string = domain.stores.join(", ");
  const user_input = xml_escape(input);

  return `
<prompt>
  <system>
    Du är en strikt svensk extraherare för inköpsrader.
    Du får en kort svensk text som beskriver en vara.
    Returnera endast giltig JSON med alla fält enligt schemat.
    Inga förklaringar, ingen text utanför JSON.

    Regler:
    - Tolka antal, enhet, produktnamn, varumärke, kategori-hintar, butik och kommentarer.
    - Skriv endast vad som faktiskt står, gissa aldrig.
    - Om något är oklart: quantity = 0, size_value = 0, category = null, och lägg originalfrasen i "comment".
    - Decimaler: 1,5 i text → 1.5 i JSON.
    - Osäker tolkning (t.ex. varumärke/förpackning/modifierare):
      • Lämna fältet null eller 0 (gissa aldrig).
      • Lägg hela det osäkra ordet oförändrat i "comment".
      • Om flera ord är osäkra, separera dem med mellanslag i "comment".
      • Lägg inte in ord i "comment" som redan används i andra fält.
      Exempel: "1 st Brämhults terta" → {"item":"okänd","brand":null,"comment":"Brämhults terta", ...}
    - Fältordning: behåll alltid samma ordning som i schemat.
  </system>

  <assistant_context>
    <categories>
      Tillåtna kategorier: ${categories_string}.
      Exempel:
        - "mejeriprodukter", "ägg", "mjölk", "smör", "grädde" → mejeri
        - "pasta", "ris", "olja/olivolja", "konserver", "jäst", "bönor/kikärtor" → skafferi
        - "tonfisk", "lax", "sill" → fisk & skaldjur
        - "grönsaker", "frukt", "färska bär", "färska örter/kryddor", "äpple/äpplen", "banan", "gurka", "tomat", "potatis", "lök", "morot/morötter" → frukt & grönt
        - "frysta grönsaker", "Findus ärtor" → fryst
    </categories>

    <units>
      <quantity_units>${quantity_units_string}</quantity_units>
      <size_units>${size_units_string}</size_units>
    </units>

    <stores>${stores_string}</stores>

    <brand_examples>
      Exempel på varumärken: ${brands_string}.
      Om varumärket står först: lägg det i "brand" och ta bort det från "item".
      "Findus ärtor" → item = "ärtor", brand = "Findus".
      "Zeta olivolja" → item = "olivolja", brand = "Zeta".
    </brand_examples>

    <!-- ===== New: targeted binding + category + container rules ===== -->
    <binding_rules>
      - Ord som matchar en känd enhet/kontainer (se &lt;units&gt;) får ALDRIG hamna i "comment".
      - Normalisera behållare (quantity_unit):
        "paket"|"pkt" → "pkt"
        "förp"|"förpackning"|"fp" → "fp"
        "burk" → "burk"
        "flaska" → "flaska"
        "st"|"stycken" → "st"
      - Ledande varumärke:
        Mönster: &quot;&lt;BRAND&gt; &lt;item&gt;&quot; där &lt;BRAND&gt; ∈ {${brands_string}}
        → brand = &lt;BRAND&gt;, item = &lt;item&gt; (utan varumärket).
    </binding_rules>

    <category_hints>
      - "ägg" → "mejeri"
      - "gurka"|"banan"|"äpple"|"äpplen"|"tomat"|"potatis"|"lök"|"morot"|"morötter" → "frukt & grönt"
      - "spaghetti"|"spagetti"|"pasta"|"krossade tomater"|"kikärtor"|"bönor"|"olivolja"|"jäst" → "skafferi"
      - "tonfisk" (konserv) → "fisk & skaldjur"
      - "ärtor" (frysta) → "fryst"
    </category_hints>

    <container_rules>
      - Om frasen innehåller {burk|flaska|paket|pkt|förp|fp} och inget separat antal finns:
        sätt quantity = 1 och quantity_unit enligt normaliseringen.
      - Exempel:
        "1 flaska olivolja" → quantity=1, quantity_unit="flaska"
        "kikärtor burk" → quantity=1, quantity_unit="burk"
    </container_rules>

    <comment_rules>
      - Skriv aldrig en känd enhet/kontainer eller ett känt varumärke till "comment".
      - "comment" används endast för verkligt osäkra ord (okänd sort/förpackningstyp/modifierare).
    </comment_rules>

    <item_normalization>
      - Basnamn i singular där det är naturligt: "äpplen" → "äpple", "tomater" → "tomat".
      - Acceptera båda stavningar "spaghetti"/"spagetti" (ingen tvingad ändring).
    </item_normalization>
    <!-- ===== End new rules ===== -->

    <quantity_rules>
      - "ett par" → quantity = 2 (behåll frasen i "comment" också).
      - "några", "lite", "ungefär", "cirka", "en handfull" → quantity = 0, quantity_unit = null; lägg frasen oförändrad i "comment".
      - "1,5 l", "500 g", "33 cl" utan antal → quantity = 1 och storlek sätts på size_value/size_unit.
      - Om både antal och vikt/volym finns (t.ex. "2 pkt 500 g"): vikten/volymen avser per förpackning; räkna total_quantity_value = quantity * size_value.
    </quantity_rules>

    <item_comment_rules>
      - Item: basnamn i singular (t.ex. "äpple", "tomat", "olivolja", "krossade tomater").
      - Egenskaper som färg/sort ("röda", "gröna", "små", "stora") → in i "comment" oförändrat.
      - Organiskt: "eko", "ekologisk(a)", "KRAV" → organic = true.
    </item_comment_rules>

    <examples>
      Input: "2 paket ekologisk mjölk"
      Output: {"item":"mjölk","category":"mejeri","quantity":2,"quantity_unit":"pkt","size_value":0,"size_unit":null,"brand":null,"organic":true,"comment":null,"unit_normalized":null,"total_quantity_value":0,"total_quantity_unit":null,"store_normalized":null,"store_raw":null,"offer_quantity":0,"offer_total_price_value":0,"offer_currency":null,"offer_unit_price_value":0,"status":"ok","error":null}

      Input: "1 burk krossade tomater"
      Output: {"item":"krossade tomater","category":"skafferi","quantity":1,"quantity_unit":"burk","size_value":0,"size_unit":null,"brand":null,"organic":false,"comment":null,"unit_normalized":null,"total_quantity_value":0,"total_quantity_unit":null,"store_normalized":null,"store_raw":null,"offer_quantity":0,"offer_total_price_value":0,"offer_currency":null,"offer_unit_price_value":0,"status":"ok","error":null}

      Input: "Zeta olivolja 500 ml"
      Output: {"item":"olivolja","category":"skafferi","quantity":1,"quantity_unit":null,"size_value":500,"size_unit":"ml","brand":"Zeta","organic":false,"comment":null,"unit_normalized":"ml","total_quantity_value":0,"total_quantity_unit":null,"store_normalized":null,"store_raw":null,"offer_quantity":0,"offer_total_price_value":0,"offer_currency":null,"offer_unit_price_value":0,"status":"ok","error":null}

      Input: "ett par tomater"
      Output: {"item":"tomat","category":"frukt & grönt","quantity":2,"quantity_unit":"st","size_value":0,"size_unit":null,"brand":null,"organic":false,"comment":"ett par","unit_normalized":null,"total_quantity_value":0,"total_quantity_unit":null,"store_normalized":null,"store_raw":null,"offer_quantity":0,"offer_total_price_value":0,"offer_currency":null,"offer_unit_price_value":0,"status":"ok","error":null}

      Input: "lite grädde"
      Output: {"item":"grädde","category":"mejeri","quantity":0,"quantity_unit":null,"size_value":0,"size_unit":null,"brand":null,"organic":false,"comment":"lite","unit_normalized":null,"total_quantity_value":0,"total_quantity_unit":null,"store_normalized":null,"store_raw":null,"offer_quantity":0,"offer_total_price_value":0,"offer_currency":null,"offer_unit_price_value":0,"status":"ok","error":null}

      Input: "1 st Brämhults terta"
      Output: {"item":"okänd","category":null,"quantity":1,"quantity_unit":"st","size_value":0,"size_unit":null,"brand":null,"organic":false,"comment":"Brämhults terta","unit_normalized":null,"total_quantity_value":0,"total_quantity_unit":null,"store_normalized":null,"store_raw":null,"offer_quantity":0,"offer_total_price_value":0,"offer_currency":null,"offer_unit_price_value":0,"status":"ok","error":null}
    </examples>
  </assistant_context>

  <user_input>${user_input}</user_input>
</prompt>
`.trim();
}

/**
 * Summary: Escape:ar <, >, & och citattecken i user_input.
 */
export function xml_escape(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
