import { Hono } from "hono";
import { MESSAGE } from "../constants";
import { grocery_list_router } from "./grocery-list";
import { zValidator } from "@hono/zod-validator";
import { object, string, z } from "zod/v4";
import { CloudflareEnvironmentBindings } from "../cloudflare-environment-bindings";
import { createWorkersAI } from "workers-ai-provider";
import { generateObject } from "ai";
import { AiModels, AiTextGenerationInput } from "@cloudflare/workers-types";
import { create_system_prompt } from "../AI/GroceryInputParser/prompts/system";
import { create_assistant_prompt } from "../AI/GroceryInputParser/prompts/assistant";
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
  STATUS,
  GroceryItemSchema,
} from "../AI/GroceryInputParser/grocery-item";

// const MODEL_NAME: keyof AiModels = "@cf/meta/llama-3.1-8b-instruct-fp8";
const MODEL_NAME: keyof AiModels =
  "@cf/meta/llama-3.1-8b-instruct-fast" as keyof AiModels;

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

const messages_base = [
  {
    role: "system",
    content: create_system_prompt({
      schema: GroceryItemSchema_as_json_schema,
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
    }),
  },
  {
    role: "assistant",
    content: create_assistant_prompt({
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
    }),
  },
] satisfies AiTextGenerationInput["messages"];

// console.log("messages_base", messages_base);

export const api_router = new Hono<{
  Bindings: CloudflareEnvironmentBindings;
}>()
  .route("/grocery-list", grocery_list_router)
  .post(
    "/parse-cf-ai",
    zValidator(
      "json",
      object({
        input: string().nonempty(),
      }),
    ),
    async (c) => {
      const { input } = await c.req.json();
      console.log("/parse-cf-ai", input);

      const messages = [
        ...messages_base,
        {
          role: "user",
          content: input,
        },
      ] satisfies AiTextGenerationInput["messages"];

      const response = await c.env.AI.run(MODEL_NAME, {
        messages,
        response_format: {
          type: "json_schema",
          //schema: z.toJSONSchema(z.any()),
          schema: GroceryItemSchema_as_json_schema,
        },
      });

      return c.json(response);
    },
  )
  .post("/parse-ai-sdk", async (c) => {
    const { input } = await c.req.json();
    console.log("/parse-ai-sdk", input);

    const messages = [
      ...messages_base,
      {
        role: "user",
        content: input,
      },
    ] satisfies AiTextGenerationInput["messages"];

    const workers_ai = createWorkersAI({ binding: c.env.AI });

    const result = await generateObject({
      model: workers_ai(MODEL_NAME),
      messages,
      schema: z.any(),
    });

    return c.json(result.object);
  })
  .get("/", (c) => {
    return c.json({
      message: MESSAGE,
    });
  });

export type ApiRouterType = typeof api_router;
