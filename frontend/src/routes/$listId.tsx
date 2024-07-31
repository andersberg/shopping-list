import { DisplayShoppingList } from "@/components/ShoppingList/DisplayShoppingList";
import { shoppingListQueryOptions } from "@/components/ShoppingList/shoppingListQueryOptions";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$listId")({
  loader: async ({ context: { queryClient }, params }) => {
    const listId = params.listId;
    const queryOptions = shoppingListQueryOptions(listId);

    return queryClient.ensureQueryData(queryOptions);
  },
  component: DisplayShoppingList,
});
