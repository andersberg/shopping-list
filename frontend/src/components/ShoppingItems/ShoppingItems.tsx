import { queryClient } from "@/main";
import { AddShoppingItem, ShoppingItem } from "@server/lib/ShoppingItem";
import { useMutation } from "@tanstack/react-query";
import { MainLayout } from "../MainLayout";
import { AddShoppingItemForm } from "./AddShoppingItemForm";
import { addNewShoppingItem, updateShoppingItem } from "./mutations";
import { ShoppingItemsList } from "./ShoppingItemsList";
import { shoppingItemsQueryOptions } from "./shoppingItemsQueryOptions";

export function ShoppingItems() {
  const addNewShoppingItemMutation = useMutation({
    mutationFn: (item: AddShoppingItem | ShoppingItem) => {
      if ("id" in item) {
        return updateShoppingItem(item);
      } else {
        return addNewShoppingItem(item);
      }
    },
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
