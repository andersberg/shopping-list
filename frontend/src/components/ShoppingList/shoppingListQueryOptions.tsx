import { ListsApi } from "@/lib/api";
import { ShoppingList } from "@server/lib/ShoppingList";
import { queryOptions } from "@tanstack/react-query";

export const shoppingListQueryOptions = (listId: ShoppingList["id"]) =>
  queryOptions({
    queryKey: ["list", listId],
    queryFn: async () => {
      const result = await ListsApi[":listId"].$get({
        param: { listId },
      });

      if (result.status === 404) {
        const data = await result.json();
        throw new Error(data.error);
      }

      if (!result.ok) {
        throw new Error("Failed to get list");
      }

      const data = await result.json();
      return data.shoppingList;
    },
  });
