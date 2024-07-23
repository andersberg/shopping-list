import { shoppingListsClient } from "@backend/routes/ShoppingLists";
import { queryOptions } from "@tanstack/react-query";
import { getShoppingLists } from "./DisplayShoppingLists";

export const shoppingListsQueryOptions = queryOptions({
  queryKey: ["shopping-lists"],
  queryFn: async () => {
    const result = await shoppingListsClient.index.$get();
    const data = await result.json();

    return data;
  },
});
