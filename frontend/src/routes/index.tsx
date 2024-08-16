import { RemoveListItemButton } from "@/components/Lists/RemoveListItemButton";
import { CreateNewShoppingList } from "@/components/ShoppingList/CreateNewShoppingList";
import { deleteShoppingList } from "@/components/ShoppingList/mutations";
import { shoppingListsQueryOptions } from "@/components/ShoppingList/shoppingListsQueryOptions";
import { queryClient } from "@/main";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: () => {
    const shoppingListsQuery = useQuery(shoppingListsQueryOptions);

    const removeListItemMutation = useMutation({
      mutationFn: deleteShoppingList,
      onSettled: () =>
        queryClient.invalidateQueries({
          queryKey: shoppingListsQueryOptions.queryKey,
        }),
    });

    if (!shoppingListsQuery.data) {
      return <div>Loading...</div>;
    }

    return (
      <div className="h-full grid grid-rows-[1fr_auto] gap-4">
        <ul className="divide-y " data-component="DisplayShoppingLists">
          {shoppingListsQuery.data.map((list) => (
            <li key={list.id} className="flex py-2">
              <Link
                to="/$listId"
                params={{ listId: list.id }}
                className="w-full text-2xl font-medium uppercase text-primary"
              >
                {list.name}
              </Link>

              <RemoveListItemButton
                onClick={() => removeListItemMutation.mutate(list.id)}
              />
            </li>
          ))}
        </ul>
        <CreateNewShoppingList />
      </div>
    );
  },
});
