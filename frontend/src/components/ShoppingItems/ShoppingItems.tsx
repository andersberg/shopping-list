import { queryClient } from "@/main";
import { useMutation } from "@tanstack/react-query";
import { AddShoppingItemForm } from "./AddShoppingItemForm";
import { ShoppingItemsList } from "./ShoppingItemsList";
import { addOrUpdateShoppingItem } from "./mutations";
import { shoppingItemsQueryOptions } from "./shoppingItemsQueryOptions";

export function ShoppingItems() {
  const addNewShoppingItemMutation = useMutation({
    mutationFn: addOrUpdateShoppingItem,
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: shoppingItemsQueryOptions.queryKey,
      }),
  });

  return (
    <div data-component="ShoppingItems">
      <ShoppingItemsList />
      <AddShoppingItemForm handleMutate={addNewShoppingItemMutation.mutate} />
    </div>
  );
}
