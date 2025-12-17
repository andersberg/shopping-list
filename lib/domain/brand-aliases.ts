/**
 * Brand Aliases for Fuzzy Matching
 *
 * Maps canonical brand names to array of lowercase variations
 * This enables user-friendly matching while preserving canonical forms
 */

export const BRAND_ALIASES: Record<string, string[]> = {
	"Kellogg's": ["kelloggs", "kellog", "kellogs"],
	Arla: ["arla"],
	Oatly: ["oatly", "oatley"],
	ICA: ["ica", "i.c.a", "i.c.a."],
	Coop: ["coop", "co-op"],
	Barilla: ["barilla"],
	Felix: ["felix"],
	Findus: ["findus"],
	Garant: ["garant"],
	Kelda: ["kelda"],
	Keyhole: ["keyhole"],
	Knorr: ["knorr"],
	Kungsörnen: ["kungsonen", "kungsonen"],
	Lantmännen: ["lantmannen"],
	Pågen: ["pagen"],
	Risifrutti: ["risifrutti", "risi frutti"],
	"Santa Maria": ["santa maria", "santamaria"],
	Scan: ["scan"],
	Valio: ["valio"],
	Zeta: ["zeta"],
	Eldorado: ["eldorado"],
};

/**
 * Build reverse lookup for efficient O(1) matching
 * Maps variations to canonical brands
 */
export function buildReverseLookup(
	aliases: Record<string, string[]>,
): Record<string, string> {
	const reverse: Record<string, string> = {};

	for (const [canonical, variations] of Object.entries(aliases)) {
		for (const variation of variations) {
			const normalized = variation.toLowerCase();
			if (!reverse[normalized]) {
				reverse[normalized] = canonical;
			}
		}
	}

	return reverse;
}

/**
 * Pre-built reverse lookup for performance
 * Variation -> Canonical Brand
 */
export const BRAND_VARIATIONS: Record<string, string> =
	buildReverseLookup(BRAND_ALIASES);

/**
 * Add a new brand alias
 * @param canonicalBrand - The canonical brand name
 * @param newAlias - The new alias to add (will be stored as lowercase)
 */
export function addBrandAlias(canonicalBrand: string, newAlias: string): void {
	const normalizedAlias = newAlias.toLowerCase();

	if (!BRAND_ALIASES[canonicalBrand]) {
		BRAND_ALIASES[canonicalBrand] = [];
	}

	if (!BRAND_ALIASES[canonicalBrand].includes(normalizedAlias)) {
		BRAND_ALIASES[canonicalBrand].push(normalizedAlias);
		BRAND_VARIATIONS[normalizedAlias] = canonicalBrand;
	}
}

/**
 * Remove a brand alias
 * @param canonicalBrand - The canonical brand name
 * @param aliasToRemove - The alias to remove
 */
export function removeBrandAlias(
	canonicalBrand: string,
	aliasToRemove: string,
): void {
	const normalizedAlias = aliasToRemove.toLowerCase();

	if (BRAND_ALIASES[canonicalBrand]) {
		const index = BRAND_ALIASES[canonicalBrand].indexOf(normalizedAlias);
		if (index > -1) {
			BRAND_ALIASES[canonicalBrand].splice(index, 1);
			delete BRAND_VARIATIONS[normalizedAlias];
		}
	}
}

/**
 * Get all aliases for a canonical brand
 * @param canonicalBrand - The canonical brand name
 * @returns Array of aliases or empty array if brand not found
 */
export function getBrandAliases(canonicalBrand: string): string[] {
	return BRAND_ALIASES[canonicalBrand] || [];
}

/**
 * Check if a variation exists for any brand
 * @param variation - The variation to check
 * @returns True if variation exists as an alias
 */
export function hasBrandVariation(variation: string): boolean {
	return variation.toLowerCase() in BRAND_VARIATIONS;
}

/**
 * Get canonical brand from variation
 * @param variation - The variation to look up
 * @returns Canonical brand or null if not found
 */
export function getCanonicalBrand(variation: string): string | null {
	return BRAND_VARIATIONS[variation.toLowerCase()] || null;
}
