import { z } from "zod";

export const quantity_schema = z.number().min(1);

export type Quantity = z.infer<typeof quantity_schema>;
