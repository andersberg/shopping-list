import { queryClient } from "@/main";
import { Route as ListRoute } from "@/routes/$listId";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AddShoppingItemForm } from "../ShoppingItems/AddShoppingItemForm";
import { addNewShoppingItem } from "../ShoppingItems/mutations";
import { shoppingItemsQueryOptions } from "../ShoppingItems/shoppingItemsQueryOptions";
import { shoppingListQueryOptions } from "./shoppingListQueryOptions";

export function DisplayShoppingList() {
  const { listId } = ListRoute.useParams();
  const { data: list } = useQuery(shoppingListQueryOptions(listId));

  const addShoppingItemMutation = useMutation({
    mutationFn: addNewShoppingItem,
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: shoppingItemsQueryOptions.queryKey,
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
          <li key={item.id}>
            <p className="space-x-[1ch]">
              <span>{item.quantity}</span>
              <span>{item.unit}</span>
              <span>{item.displayName}</span>
              {item.comment && <span>{item.comment}</span>}
            </p>
          </li>
        ))}
      </ul>
      <footer>
        <AddShoppingItemForm handleMutate={addShoppingItemMutation.mutate} />
      </footer>
    </main>
  );
}
