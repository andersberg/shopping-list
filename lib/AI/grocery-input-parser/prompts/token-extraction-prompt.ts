/**
 * Creates a prompt for extracting structured tokens from Swedish grocery input text.
 *
 * @param input - Raw Swedish grocery text (e.g. "2 paket ekologisk mjölk")
 * @returns Formatted prompt string for AI model
 *
 * @example
 * ```ts
 * const prompt = create_token_extraction_prompt("2 paket ekologisk mjölk");
 * // Returns a prompt that instructs the AI to extract tokens
 * ```
 */
export function create_token_extraction_prompt(input: string): string {
	return `Du är en assistent som extraherar strukturerad information från svensk mat-inköpstext.

Din uppgift är att analysera följande text och extrahera specifika fält. Svara ENDAST med ett JSON-objekt, ingen annan text.

Input: "${input}"

Extrahera följande fält:
- raw_text: Den ursprungliga texten exakt som den är
- raw_item: Namnet på matprodukten (t.ex. "mjölk", "potatis", "ägg")
- raw_qty: Antal enheter/paket (t.ex. "2", "1") eller null om det bara är en vikt/storlek
- raw_unit: Enhet för kvantitet (t.ex. "paket", "burk", "st", "kg") eller null
- raw_brand: Varumärke om angivet, annars null
- raw_modifiers: Array med beskrivande ord som "ekologisk", "krossade" etc. Tom array [] om inga
- raw_offer: Erbjudandetext om angiven (t.ex. "2 för 50kr"), annars null
- raw_size_value: Storleksvärde om angivet (t.ex. "500" från "500 g"), annars null
- raw_size_unit: Storleksenhet om angiven (t.ex. "g", "ml", "kg"), annars null
- raw_comment: Övrig kommentar eller notering, annars null

Regler:
1. raw_qty är för antal paket/enheter (2 paket, 3 burkar). Om texten bara är "500 g spaghetti" utan paket, är raw_qty null.
2. raw_size_value och raw_size_unit är för vikt/volym PER enhet (500 g, 1 L).
3. Modifiers är adjektiv som beskriver produkten: ekologisk, krossade, färsk, etc.
4. Om inget värde finns, använd null (inte tom sträng "").
5. Svara ENDAST med JSON, ingen förklarande text.

Exempel 1:
Input: "2 paket ekologisk mjölk"
Output: {"raw_text":"2 paket ekologisk mjölk","raw_item":"mjölk","raw_qty":"2","raw_unit":"paket","raw_brand":null,"raw_modifiers":["ekologisk"],"raw_offer":null,"raw_size_value":null,"raw_size_unit":null,"raw_comment":null}

Exempel 2:
Input: "500 g spaghetti"
Output: {"raw_text":"500 g spaghetti","raw_item":"spaghetti","raw_qty":null,"raw_unit":null,"raw_brand":null,"raw_modifiers":[],"raw_offer":null,"raw_size_value":"500","raw_size_unit":"g","raw_comment":null}

Exempel 3:
Input: "1 burk krossade tomater"
Output: {"raw_text":"1 burk krossade tomater","raw_item":"krossade tomater","raw_qty":"1","raw_unit":"burk","raw_brand":null,"raw_modifiers":[],"raw_offer":null,"raw_size_value":null,"raw_size_unit":null,"raw_comment":null}

Nu, analysera input-texten och svara med JSON:`;
}
