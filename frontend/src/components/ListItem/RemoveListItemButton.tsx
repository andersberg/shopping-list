import { queryClient } from "@/main";
import { TrashIcon } from "@heroicons/react/24/outline";
import { ShoppingItem } from "@server/lib/ShoppingItem";
import { ShoppingList } from "@server/lib/ShoppingList";
import { useMutation } from "@tanstack/react-query";
import { removeShoppingItemFromList } from "../ShoppingList/mutations";
import { shoppingListQueryOptions } from "../ShoppingList/shoppingListQueryOptions";
import { Button } from "../ui/button";

export function RemoveListItemButton({
  inputName,
  itemId,
  listId,
}: {
  itemId: ShoppingItem["id"];
  inputName: ShoppingItem["value"];
  listId: ShoppingList["id"];
}) {
  const deleteListItemMutation = useMutation({
    mutationFn: () => removeShoppingItemFromList(listId, itemId),
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: shoppingListQueryOptions(listId).queryKey,
      }),
  });

  function handleDelete(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const input = formData.get(inputName);

    if (typeof input === "string") {
      deleteListItemMutation.mutate();
    }
  }

  return (
    <form onSubmit={handleDelete}>
      <input type="hidden" id={inputName} name={inputName} value={itemId} />
      <Button variant={"ghost"} size={"sm"}>
        <TrashIcon className="text-destructive size-4" />
      </Button>
    </form>
  );
}
