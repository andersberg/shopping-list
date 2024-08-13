import { queryClient } from "@/main";
import { Route as ListRoute } from "@/routes/$listId";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { ShoppingItem } from "@server/lib/ShoppingItem";
import { useMutation, useQuery } from "@tanstack/react-query";
import { shoppingItemsQueryOptions } from "../ShoppingItems/shoppingItemsQueryOptions";
import { Button } from "../ui/button";
import { RemoveListItemButton } from "./RemoveListItemButton";
import { addShoppingItemToList } from "./mutations";
import { shoppingListQueryOptions } from "./shoppingListQueryOptions";

export function DisplayShoppingList() {
  const { listId } = ListRoute.useParams();
  const listQueryOptions = shoppingListQueryOptions(listId);
  const { data: list } = useQuery(listQueryOptions);
  const { data: items } = useQuery(shoppingItemsQueryOptions);

  const addShoppingItemMutation = useMutation({
    mutationFn: async (item: ShoppingItem) =>
      addShoppingItemToList(listId, item),
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: listQueryOptions.queryKey,
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
            <p className="space-x-[1ch]">
              <span>{item.quantity}</span>
              <span>{item.unit}</span>
              <span>{item.displayName}</span>
              {item.comment && <span>{item.comment}</span>}
            </p>
            <RemoveListItemButton
              inputName={item.value}
              itemId={item.id}
              listId={list.id}
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
        <p>AddShoppingItemForm</p>
        {/* <AddShoppingItemForm handleMutate={addShoppingItemMutation.mutate} /> */}
      </footer>
    </main>
  );
}
