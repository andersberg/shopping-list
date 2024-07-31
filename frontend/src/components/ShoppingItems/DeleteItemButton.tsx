import { queryClient } from "@/main";
import { TrashIcon } from "@heroicons/react/24/outline";
import { useMutation } from "@tanstack/react-query";
import { Button } from "../ui/button";
import { deleteShoppingItem } from "./mutations";
import { shoppingItemsQueryOptions } from "./shoppingItemsQueryOptions";

export function DeleteItemButton({
  inputName,
  itemId,
}: {
  itemId: string;
  inputName: string;
}) {
  const deleteShoppingItemMutation = useMutation({
    mutationFn: deleteShoppingItem,
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: shoppingItemsQueryOptions.queryKey,
      }),
  });

  function handleDelete(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const input = formData.get(inputName);

    if (typeof input === "string") {
      deleteShoppingItemMutation.mutate(input);
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
