import { ItemsApi } from "@/lib/api";
import { ShoppingItem } from "@server/lib/ShoppingItem";
import { queryOptions } from "@tanstack/react-query";

export const shoppingItemQueryOptions = (itemId: ShoppingItem["id"]) =>
  queryOptions({
    queryKey: ["item", itemId],
    queryFn: async () => {
      const result = await ItemsApi[":id"].$get({
        param: { id: itemId },
      });

      if (result.status === 404) {
        const data = await result.json();
        throw new Error(data.error);
      }

      if (!result.ok) {
        throw new Error("Failed to get item");
      }

      return await result.json();
    },
  });
