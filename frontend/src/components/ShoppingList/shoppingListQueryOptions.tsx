import { ShoppingList } from "@backend/lib/ShoppingList";
import { shoppingListsClient } from "@backend/routes/ShoppingLists";
import { queryOptions } from "@tanstack/react-query";

export const shoppingListQueryOptions = (listId: ShoppingList["id"]) =>
  queryOptions({
    queryKey: ["shopping-list", listId],
    queryFn: async () => {
      const result = await shoppingListsClient[":id"].$get({
        param: { id: listId },
      });

      const data = await result.json();

      return data;
    },
  });
