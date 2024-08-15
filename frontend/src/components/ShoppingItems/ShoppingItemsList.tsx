import { queryClient } from "@/main";
import { ShoppingItem } from "@server/lib/ShoppingItem";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ListItem } from "../ListItem/ListItem";
import { deleteShoppingItem, updateShoppingItem } from "./mutations";
import { shoppingItemsQueryOptions } from "./shoppingItemsQueryOptions";

export function ShoppingItemsList() {
  const { data: shoppingItems } = useQuery(shoppingItemsQueryOptions);

  const editListItemMutation = useMutation({
    mutationFn: updateShoppingItem,
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: shoppingItemsQueryOptions.queryKey,
      }),
  });

  const removeListItemMutation = useMutation({
    mutationFn: async (item: ShoppingItem) => deleteShoppingItem(item.id),
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: shoppingItemsQueryOptions.queryKey,
      }),
  });

  if (!shoppingItems) {
    return <div>Loading...</div>;
  }

  return (
    <div className="">
      <ul className="divide-y">
        {shoppingItems.map((item) => (
          <li key={item.id} className="py-2">
            <ListItem
              item={item}
              onDelete={removeListItemMutation.mutate}
              onEdit={editListItemMutation.mutate}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
