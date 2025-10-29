import { Hono } from "hono";
import { MESSAGE } from "../constants";
import { grocery_list_router } from "./grocery-list";
import { zValidator } from "@hono/zod-validator";
import { object, string, z } from "zod/v4";
import { CloudflareEnvironmentBindings } from "../cloudflare-environment-bindings";
import type { AiModels } from "@cloudflare/workers-types";
import { prompt_builder } from "../AI/GroceryInputParser/prompts/prompt-builder";
import { STORE_NAMES } from "../AI/GroceryInputParser/store-names";
import { BRAND_NAMES } from "../AI/GroceryInputParser/brand-names";
import { CATEGORY_NAMES } from "../AI/GroceryInputParser/category-names";
import { QUANTITY_UNITS } from "../AI/GroceryInputParser/quantity-units";
import { SIZE_UNITS } from "../AI/GroceryInputParser/size-units";

// const MODEL_NAME: keyof AiModels = "@cf/meta/llama-3.1-8b-instruct-fp8";
const MODEL_NAME: keyof AiModels =
  "@cf/meta/llama-3.1-8b-instruct-fast" as keyof AiModels;

const STATUS = ["ok", "unparsed"] as const;
const CURRENCY = ["SEK"];

const GroceryItemSchema = z.strictObject({
  item: z.string().nullable(),
  category: z.enum(CATEGORY_NAMES).nullable(),
  quantity: z.number().min(0),
  quantity_unit: z.enum(QUANTITY_UNITS).nullable(),
  size_value: z.number().min(0),
  size_unit: z.enum(SIZE_UNITS).nullable(),
  brand: z.string().nullable(),
  organic: z.boolean(),
  comment: z.string().nullable(),
  unit_normalized: z.enum(SIZE_UNITS).nullable(),
  total_quantity_value: z.number().min(0),
  total_quantity_unit: z.enum(SIZE_UNITS).nullable(),
  store_normalized: z.enum(STORE_NAMES).nullable(),
  store_raw: z.string().nullable(),
  offer_quantity: z.number().min(0),
  offer_total_price_value: z.number().min(0),
  offer_currency: z.enum(CURRENCY).nullable(),
  offer_unit_price_value: z.number().min(0),
  status: z.enum(STATUS),
  error: z.string().nullable(),
});

const loose_GroceryItemSchema = z.looseObject({
  ...GroceryItemSchema.shape,
  category: z.string().nullable(),
  quantity_unit: z.string().min(1).nullable(),
  size_unit: z.string().min(1).nullable(),
  unit_normalized: z.string().min(1).nullable(),
  total_quantity_unit: z.string().min(1).nullable(),
  store_normalized: z.string().min(1).nullable(),
  offer_currency: z.string().min(1).nullable(),
  status: z.enum(STATUS),
});

const GroceryItemSchema_as_json_schema = z.toJSONSchema(
  loose_GroceryItemSchema,
);

function create_prompt(input: string) {
  return prompt_builder(input, {
    categories: CATEGORY_NAMES,
    quantity_units: QUANTITY_UNITS,
    size_units: SIZE_UNITS,
    brands: BRAND_NAMES,
    stores: STORE_NAMES,
  });
}

// console.log("messages_base", messages_base);

export const api_router = new Hono<{
  Bindings: CloudflareEnvironmentBindings;
}>()
  .route("/grocery-list", grocery_list_router)
  .post(
    "/parse",
    zValidator(
      "json",
      object({
        input: string().nonempty(),
      }),
    ),
    async (c) => {
      const { input } = await c.req.json();
      console.log("/parse-cf-ai", input);

      const response = await c.env.AI.run(MODEL_NAME, {
        prompt: create_prompt(input),
        response_format: {
          type: "json_schema",
          //schema: z.toJSONSchema(z.any()),
          schema: GroceryItemSchema_as_json_schema,
        },
      });

      return c.json(response);
    },
  )
  .get("/", (c) => {
    return c.json({
      message: MESSAGE,
    });
  });

export type ApiRouterType = typeof api_router;
