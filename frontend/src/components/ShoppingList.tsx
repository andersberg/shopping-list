import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Cross2Icon } from "@radix-ui/react-icons";
import { useForm } from "react-hook-form";
// import { useForm } from "@tanstack/react-form";
// import { zodValidator } from "@tanstack/zod-form-adapter";
import { parseShoppingItemInput } from "@/lib/parseShoppingItemInput";
import { ShoppingListItem, ShoppingListItemSchema } from "@/lib/schema";
import { nanoid } from "nanoid";
import { useState } from "react";
import { z } from "zod";
// import { Button } from "./components/ui/button";
// import { Input } from "./components/ui/input";
// import { ShoppingListItemSchema } from "./lib/schema";

const initialShoppingList: Array<ShoppingListItem> = [
  {
    id: nanoid(),
    value: "mjöl",
    displayName: "Mjöl",
    unit: "kg",
    quantity: 1,
    comment: "3 för 2",
  },
];

export function ShoppingList() {
  const [items, setItems] = useState(initialShoppingList);

  return (
    <div className="flex flex-col items-center justify-center h-svh">
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <p className="space-x-[1ch]">
              <span>{item.quantity}</span>
              <span>{item.unit}</span>
              <span>{item.displayName}</span>
              {item.comment && <span>{item.comment}</span>}
            </p>
          </li>
        ))}
      </ul>
      <form
        onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const item = data.get("item");

          const result = parseShoppingItemInput(z.string().parse(item), items);

          const newItem = ShoppingListItemSchema.parse({
            ...result,
            id: nanoid(),
          });

          setItems((items) => [...items, newItem]);
          event.currentTarget.reset();
        }}
      >
        <input
          type="text"
          id="item"
          name="item"
          className="p-2 border rounded"
          placeholder="Lägg till vara"
          autoFocus
        />
      </form>
    </div>
  );
}
