import { ListsApi } from "@/lib/api";
import { ShoppingList } from "@server/lib/ShoppingList";
import { queryOptions } from "@tanstack/react-query";

export const shoppingListQueryOptions = (listId: ShoppingList["id"]) =>
  queryOptions({
    queryKey: ["list", listId],
    queryFn: async () => {
      const result = await ListsApi[":id"].$get({
        param: { id: listId },
      });

      if (!result.ok) {
        const error = await result.json();
        throw new Error(result.json().error);
      }
      const data = await result.json();
      return data;
    },
  });
