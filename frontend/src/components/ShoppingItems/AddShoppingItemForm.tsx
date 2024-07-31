import { parseShoppingItemInput } from "@/lib/parseShoppingItemInput";
import { queryClient } from "@/main";
import { ShoppingItem } from "@server/lib/ShoppingItem";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Input } from "../ui/input";
import { addNewShoppingItem } from "./mutations";
import { shoppingItemsQueryOptions } from "./shoppingItemsQueryOptions";

const INPUT_NAME = "value";

export function AddShoppingItemForm() {
  const shoppingItemsQuery = useQuery(shoppingItemsQueryOptions);

  const addNewShoppingItemMutation = useMutation({
    mutationFn: addNewShoppingItem,
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: shoppingItemsQueryOptions.queryKey,
      }),
  });

  function handleOnSubmit(
    event: React.FormEvent<HTMLFormElement>,
    data: ShoppingItem[]
  ) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const input = formData.get(INPUT_NAME);

    if (typeof input === "string") {
      const parsed = parseShoppingItemInput(input, data);
      addNewShoppingItemMutation.mutate(parsed);
      console.log(parsed);
      event.currentTarget.reset();
    }
  }

  if (!shoppingItemsQuery.data) {
    return <div>Loading...</div>;
  }

  return (
    <form
      onSubmit={(event) => handleOnSubmit(event, shoppingItemsQuery.data)}
      className="fixed inset-x-0 bottom-0 z-50 p-2 py-4 "
    >
      <Input
        name={INPUT_NAME}
        placeholder="Lägg till vara"
        // className="bg-primary-foreground"
      />
    </form>
  );
}
