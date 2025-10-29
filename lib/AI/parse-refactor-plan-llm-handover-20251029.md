LLM Handover: Grocery Parser (2-fas)

Översikt

Implementera en tvåstegspipeline:
	1.	Extraction Pass (LLM) – identifiera ord som står (utan tolkning).
	2.	Normalization Pass (backend/LLM) – tolka/validera mot domänlistor och räkna fram kanoniskt totalvärde.

Motiv: 8B-modellen tappar precision när extraktion + tolkning blandas. Genom att dela upp minskar promptstorlek och kognitiv last → stabilare resultat.

⸻

FAS 1 – Extraction Pass (LLM)

Syfte: Hitta råa tokens. Ingen logik, inget gissande, ingen summering.

Systeminstruktion (kärna):
	•	Svara endast giltig JSON (ingen text utanför).
	•	“Skriv endast vad som faktiskt står, gissa aldrig.”
	•	Extrahera ord som förekommer i input: item, siffror, enheter, förpackningsord, varumärken, butik, modifierare, vaga kvantitetsfraser.
	•	Markera “organic_flag” vid “eko/ekologisk/KRAV”.

Input (ex):

{
  "text": "2 pkt ekologisk mjölk från Ica",
  "hints": {
    "unit_words": ["st","pkt","burk","flaska","kg","g","l","dl","ml"],
    "brand_list": ["Arla","Oatly","Garant","Zeta","Findus","Coop","Ica","Änglamark"],
    "store_list": ["ica","coop","willys","hemköp","lidl"]
  }
}

Output (ex):

{
  "raw_item": "mjölk",
  "raw_numbers": ["2"],
  "raw_units": ["pkt"],
  "raw_pack_words": ["pkt"],
  "raw_brand_candidates": [],
  "raw_store_candidates": ["Ica"],
  "raw_modifiers": ["ekologisk"],
  "uncertain_phrases": [],
  "organic_flag": true,
  "original": "2 pkt ekologisk mjölk från Ica"
}

Edge rules (Fas 1):
	•	“ett par” → lägg i uncertain_phrases: ["ett par"] (ingen tolkning till “2” här).
	•	“ungefär”, “några”, “lite” → lägg i uncertain_phrases.
	•	“500 g”, “2 l” → separera till raw_numbers:["500"], raw_units:["g"] etc.
	•	Kategori inte sättas här.

⸻

FAS 2 – Normalization Pass (Backend / LLM)

Syfte: Tillämpa deterministiska regler, mappa mot listor, beräkna totals.

Input:
	•	raw = resultat från Fas 1
	•	domain:

{
  categories: string[],
  quantity_units: string[],   // ex. ["st","pkt","burk","flaska"]
  size_units: string[],       // ex. ["g","kg","ml","l","dl"]
  brands: string[],
  stores: string[]
}



Algoritm (pseudokod):

function normalize(raw, domain) {
  const item = normalizeItem(raw.raw_item); // singular, lower-case m.m.

  const brand = pickFirst(
    raw.raw_brand_candidates
      .map(n => normalizeName(n))
      .filter(n => inList(n, domain.brands))
  );

  const store_raw = pickFirst(raw.raw_store_candidates);
  const store_normalized = normalizeStore(store_raw, domain.stores);

  const organic = raw.organic_flag === true;

  // 1) Hårda regler för kvantitet/storlek
  // - Om "X <size_unit>" utan förpackningsord -> quantity=1, size_value=X, size_unit=<unit>
  // - Om både quantity (st/pkt/burk/flaska...) och per-förpackningsstorlek hittas → räkna totala
  // - Vaga fraser (några/ungefär/lite/ett par) → quantity=0/size=0 och spara frasen i comment

  const { quantity, quantity_unit, size_value, size_unit, commentFromVague } =
    inferQuantityAndSize(raw, domain);

  // 2) Kanonisk total
  const { total_value, total_unit } =
    toCanonical(quantity, quantity_unit, size_value, size_unit);

  // 3) Kategori (deterministiskt, konservativt):
  const category = inferCategory(item, domain.categories); // fallback null om tveksamt

  // 4) Kommentar
  const comment = joinComments(raw.uncertain_phrases, raw.raw_modifiers, commentFromVague);

  return {
    item,
    category,
    quantity,
    quantity_unit,
    size_value,
    size_unit,
    brand: brand ?? null,
    organic,
    comment: comment ?? null,
    unit_normalized: size_unit ?? null,
    total_quantity_value: total_value ?? 0,
    total_quantity_unit: total_unit ?? null,
    store_normalized: store_normalized ?? null,
    store_raw: store_raw ?? null,
    offer_quantity: 0,
    offer_total_price_value: 0,
    offer_currency: null,
    offer_unit_price_value: 0,
    status: "ok",
    error: null
  };
}

Viktiga normaliseringsregler:
	•	Vaga uttryck (“några”, “lite”, “ungefär”, “ett par”):
	•	quantity=0, size_value=0, lägg frasen i comment.
	•	Undantag: “ett par” kan backend-översättas till quantity=2 om du vill, men behåll frasen i comment.
	•	Enbart vikt/volym (“500 g spaghetti”): quantity=1, size_value=500, size_unit="g".
	•	Både antal och storlek (“2 pkt 500 g”): total = 1000 g.
	•	Enheter: mappa till basenheter (g, kg, ml, l, st, pkt, burk, flaska).
	•	Skriv “dl” → size_unit="dl" men i total bör du konvertera till ml (3 dl → 300 ml) för konsekvent total_quantity_unit.
	•	Butik/varumärke: normalisera namn (casefold + accent clean) och validera mot domain.*.
	•	Kategori: enkel lemmatizer + ordlistor (t.ex. mjölk→mejeri, ärtor→fryst om brand=Findus + “750 g” fryst sort).

⸻

Slutligt schema (output)

Behåll schema men låt konsumenter primärt använda total_quantity_value + total_quantity_unit.
quantity/size är interna fält för att möjliggöra prisperenhet, erbjudanden, multipack, osv.

{
  "item": "string",
  "category": "string|null",
  "quantity": number,                 // 0 om okänt/vagt
  "quantity_unit": "string|null",     // "st","pkt","burk","flaska"...
  "size_value": number,               // 0 om saknas
  "size_unit": "string|null",         // "g","kg","ml","l","dl"
  "brand": "string|null",
  "organic": boolean,
  "comment": "string|null",
  "unit_normalized": "string|null",   // normalt samma som size_unit
  "total_quantity_value": number,     // kanoniskt värde (ev. konverterat)
  "total_quantity_unit": "string|null",
  "store_normalized": "string|null",
  "store_raw": "string|null",
  "offer_quantity": number,
  "offer_total_price_value": number,
  "offer_currency": "string|null",
  "offer_unit_price_value": number,
  "status": "ok" | "error",
  "error": "string|null"
}


⸻

Acceptanskriterier
	•	Fas 1 returnerar alltid giltig JSON och återger exakt ord som hittats (ingen tolkning).
	•	Fas 2 producerar giltig output enligt schema och:
	•	Fyller category endast när den är säker, annars null.
	•	Konverterar “dl” → ml i total; “kg” → g är tillåtet (välj en kanonisk standard och håll den konsekvent).
	•	Vaga uttryck hamnar i comment och sätter quantity=0/size_value=0.
	•	“500 g X” → quantity=1, size_value=500, size_unit="g".
	•	“2 pkt 500 g” → total_quantity_value=1000, total_quantity_unit="g".
	•	“Brand first” (“Zeta olivolja 500 ml”): brand="Zeta", item="olivolja".
	•	Butiker (Ica/Coop/…): store_raw behåller originalcase, store_normalized matchar domän.

⸻

Felhantering & Loggning
	•	Om Fas 1 misslyckas/parsing error → returnera {status:"error", error:"extraction_failed"}.
	•	Om Fas 2 inte kan tolka (t.ex. okänd enhet) → sätt status:"ok", fyll så mycket som möjligt, och lägg förklaringen i comment.
	•	Logga input, fas1-output, fas2-output, regler som triggades.

⸻

Modeller & Budget
	•	Fas 1: @cf/meta/llama-3.1-8b-instruct (snabb, billig), max ~400–600 tokens per anrop.
	•	Fas 2: backend-kod föredras. Om LLM behövs för svåra rader → kort reparationsprompt (samma modell duger).

⸻

Testfall (minimum)
	•	“500 g spaghetti” → quantity=1, size=500 g, total=500 g, category=skafferi.
	•	“2 pkt 500 g ärtor Findus” → brand=Findus, category=fryst, total=1000 g.
	•	“ett par tomater” → quantity=0 (eller 2 om ni vill) + comment="ett par", category=frukt & grönt.
	•	“lite grädde” → quantity=0, comment="lite", category=mejeri.
	•	“Arla mjölk 1.5 l från Ica” → brand=Arla, size=1.5 l, quantity=1, store_* ifyllda.

⸻

Implementations-tips
	•	Gör inferQuantityAndSize() deterministisk (regex + tabell över enheter + multipacklogik).
	•	Standardisera total_quantity_unit till ett litet set: ["g","ml","st"] (konvertera kg→g, l/dl→ml).
	•	Lägg category_rules.json externt för enklare iteration (keyword→kategori).
