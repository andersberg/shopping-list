import { queryClient } from "@/main";
import { useMutation } from "@tanstack/react-query";
import { MainLayout } from "../MainLayout";
import { AddShoppingItemForm } from "./AddShoppingItemForm";
import { addOrUpdateShoppingItem } from "./mutations";
import { ShoppingItemsList } from "./ShoppingItemsList";
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
    <MainLayout title="Varor">
      <ShoppingItemsList />
      <AddShoppingItemForm handleMutate={addNewShoppingItemMutation.mutate} />
    </MainLayout>
  );
}
