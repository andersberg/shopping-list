import { queryClient } from "@/main";
import { Route as ListRoute } from "@/routes/$listId";
import { PlusIcon } from "@heroicons/react/24/outline";
import { AddShoppingItem, ShoppingItem } from "@server/lib/ShoppingItem";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ListItem } from "../ListItem/ListItem";
import { RemoveListItemButton } from "../ListItem/RemoveListItemButton";
import { AddShoppingItemForm } from "../ShoppingItems/AddShoppingItemForm";
import { shoppingItemsQueryOptions } from "../ShoppingItems/shoppingItemsQueryOptions";
import { Button } from "../ui/button";
import {
  addShoppingItemToList,
  removeShoppingItemFromList,
  updateShoppingListItem,
} from "./mutations";
import { shoppingListQueryOptions } from "./shoppingListQueryOptions";

export function DisplayShoppingList() {
  const { listId } = ListRoute.useParams();
  const listQueryOptions = shoppingListQueryOptions(listId);
  const { data: list } = useQuery(listQueryOptions);
  const { data: items } = useQuery(shoppingItemsQueryOptions);

  const addShoppingItemMutation = useMutation({
    mutationFn: async (item: ShoppingItem | AddShoppingItem) =>
      addShoppingItemToList(listId, item),
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: shoppingListQueryOptions(listId).queryKey,
      }),
  });

  const editListItemMutation = useMutation({
    mutationFn: async (item: ShoppingItem) =>
      updateShoppingListItem(listId, item),
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: shoppingListQueryOptions(listId).queryKey,
      }),
  });

  const removeListItemMutation = useMutation({
    mutationFn: async (item: ShoppingItem) =>
      removeShoppingItemFromList(listId, item),
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: shoppingListQueryOptions(listId).queryKey,
      }),
  });

  if (!list) {
    return <div>Loading...</div>;
  }

  return (
    <main className="space-y-4">
      <header className="py-4">
        <h2 className="text-2xl font-bold uppercase">{list.name}</h2>
      </header>
      <ul>
        {list.items.map((item) => (
          <li key={item.id} className="flex gap-4">
            <ListItem
              item={item}
              onDelete={removeListItemMutation.mutate}
              onEdit={editListItemMutation.mutate}
            />
          </li>
        ))}
      </ul>

      {items && (
        <div>
          <h3 className="text-xl font-bold uppercase">Varor</h3>
          <ul className="space-y-4">
            {items.map((item) => (
              <li key={item.id} className="flex gap-4">
                <p className="space-x-[1ch]">
                  <span>{item.quantity}</span>
                  <span>{item.unit}</span>
                  <span>{item.displayName}</span>
                </p>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    addShoppingItemMutation.mutate(item);
                  }}
                >
                  <Button size="icon" type="submit" className="size-6">
                    <PlusIcon className="size-4" />
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      )}

      <footer>
        <AddShoppingItemForm handleMutate={addShoppingItemMutation.mutate} />
      </footer>
    </main>
  );
}
