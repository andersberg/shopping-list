import type { AI } from "../../cloudflare-environment-bindings";
import { z } from "zod";
import { createWorkersAI } from "workers-ai-provider";
import { generateObject } from "ai";
import { SYSTEM_PROMPT } from "./prompts/system";
import { ASSISTANT_PROMPT } from "./prompts/assistant";

const QUANTITY_UNITS = [
  "st",
  "pkt",
  "burk",
  "flaska",
  "påse",
  "förp",
  "kartong",
  "rulle",
] as const;

const SIZE_UNITS = ["g", "kg", "ml", "cl", "dl", "l"] as const;

const STATUS = ["ok", "unparsed"] as const;

export const GroceryItemSchema = z.object({
  item: z.string().nullable(),
  category: z.string(),
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
  status: z.enum(STATUS),
  error: z.string().nullable(),
});

type GroceryItem = z.infer<typeof GroceryItemSchema>;

const AI_MODEL = "@cf/meta/llama-3.1-70b-instruct";

export class GroceryInputParser {
  private readonly workers_ai;

  constructor(ai: AI) {
    this.workers_ai = createWorkersAI({ binding: ai });
  }

  async parse_input(input: string): Promise<GroceryItem> {
    console.log("Parsing input:", input);
    const result = await generateObject({
      model: this.workers_ai(AI_MODEL, { temperature: 0.1 }),
      system: SYSTEM_PROMPT,
      messages: [
        { role: "assistant", content: ASSISTANT_PROMPT },
        { role: "user", content: input },
      ],
      schema: GroceryItemSchema,
    });

    console.log("Parsed result:", result.object);

    return result.object;
  }
}
