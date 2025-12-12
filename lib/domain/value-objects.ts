import z from "zod/v4";

// --- Container Unit Value Object ---

/** Zod schema for container unit validation */
export const container_unit_schema = z
	.string()
	.min(1, "Container unit cannot be empty")
	.brand<"ContainerUnit">();

/** Container unit branded type */
export type ContainerUnit = z.infer<typeof container_unit_schema>;

/**
 * Creates a validated ContainerUnit from a string value.
 * Basic validation - ensures non-empty string.
 * Static list validation will be added in future iteration.
 *
 * @param value - Raw container unit string to validate
 * @returns Validated ContainerUnit branded type
 * @throws {ZodError} If value is empty or invalid
 *
 * @example
 * ```typescript
 * const unit = create_container_unit("burkar"); // ✅ Valid
 * const unit = create_container_unit(""); // ❌ Throws ZodError
 * ```
 */
export const create_container_unit = (value: string): ContainerUnit => {
	return container_unit_schema.parse(value);
};

// --- Store Value Object ---

/** Zod schema for store validation */
export const store_schema = z
	.string()
	.min(1, "Store name cannot be empty")
	.brand<"Store">();

/** Store branded type */
export type Store = z.infer<typeof store_schema>;

/**
 * Creates a validated Store from a string value.
 * Basic validation - ensures non-empty string.
 * Static list validation will be added in future iteration.
 *
 * @param value - Raw store name string to validate
 * @returns Validated Store branded type
 * @throws {ZodError} If value is empty or invalid
 *
 * @example
 * ```typescript
 * const store = create_store("ICA"); // ✅ Valid
 * const store = create_store(""); // ❌ Throws ZodError
 * ```
 */
export const create_store = (value: string): Store => {
	return store_schema.parse(value);
};

// --- Brand Value Object ---

/** Zod schema for brand validation */
export const brand_schema = z
	.string()
	.min(1, "Brand name cannot be empty")
	.brand<"Brand">();

/** Brand branded type */
export type Brand = z.infer<typeof brand_schema>;

/**
 * Creates a validated Brand from a string value.
 * Basic validation - ensures non-empty string.
 * Static list validation will be added in future iteration.
 *
 * @param value - Raw brand name string to validate
 * @returns Validated Brand branded type
 * @throws {ZodError} If value is empty or invalid
 *
 * @example
 * ```typescript
 * const brand = create_brand("Arla"); // ✅ Valid
 * const brand = create_brand(""); // ❌ Throws ZodError
 * ```
 */
export const create_brand = (value: string): Brand => {
	return brand_schema.parse(value);
};

// --- Property Value Object ---

/** Zod schema for property validation */
export const property_schema = z
	.string()
	.min(1, "Property cannot be empty")
	.brand<"Property">();

/** Property branded type */
export type Property = z.infer<typeof property_schema>;

/**
 * Creates a validated Property from a string value.
 * Basic validation - ensures non-empty string.
 * Static list validation will be added in future iteration.
 *
 * @param value - Raw property name string to validate
 * @returns Validated Property branded type
 * @throws {ZodError} If value is empty or invalid
 *
 * @example
 * ```typescript
 * const property = create_property("ekologisk"); // ✅ Valid
 * const property = create_property(""); // ❌ Throws ZodError
 * ```
 */
export const create_property = (value: string): Property => {
	return property_schema.parse(value);
};

// --- Category Value Object ---

/** Zod schema for category validation */
export const category_schema = z
	.string()
	.min(1, "Category cannot be empty")
	.brand<"Category">();

/** Category branded type */
export type Category = z.infer<typeof category_schema>;

/**
 * Creates a validated Category from a string value.
 * Basic validation - ensures non-empty string.
 * Static list validation will be added in future iteration.
 *
 * @param value - Raw category name string to validate
 * @returns Validated Category branded type
 * @throws {ZodError} If value is empty or invalid
 *
 * @example
 * ```typescript
 * const category = create_category("mejeri"); // ✅ Valid
 * const category = create_category(""); // ❌ Throws ZodError
 * ```
 */
export const create_category = (value: string): Category => {
	return category_schema.parse(value);
};

// --- Item Canonical Value Object ---

/** Zod schema for item canonical validation */
export const item_canonical_schema = z
	.string()
	.min(1, "Item canonical cannot be empty")
	.brand<"ItemCanonical">();

/** Item canonical branded type */
export type ItemCanonical = z.infer<typeof item_canonical_schema>;

/**
 * Creates a validated ItemCanonical from a string value.
 * Basic validation - ensures non-empty string.
 * Ready for future DB integration and advanced validation.
 *
 * @param value - Raw item canonical string to validate
 * @returns Validated ItemCanonical branded type
 * @throws {ZodError} If value is empty or invalid
 *
 * @example
 * ```typescript
 * const canonical = create_item_canonical("mjölk"); // ✅ Valid
 * const canonical = create_item_canonical(""); // ❌ Throws ZodError
 * ```
 */
export const create_item_canonical = (value: string): ItemCanonical => {
	return item_canonical_schema.parse(value);
};
