import { parseShoppingItemInput } from "@/lib/parseShoppingItemInput";
import { queryClient } from "@/main";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AddShoppingItem,
  ShoppingItem,
} from "../../../../server/lib/ShoppingItem";
import { Input } from "../ui/input";
import { addShoppingItem } from "./mutations";
import { getShoppingItems } from "./resources";

const INPUT_NAME = "input";

const shoppingListsQueryKey = ["shopping-items"];

export function ShoppingItemsList() {
  const shoppingItemsQuery = useQuery<ShoppingItem[]>({
    queryKey: shoppingListsQueryKey,
    queryFn: getShoppingItems,
  });

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
    data: ShoppingItem[]
  ) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const input = formData.get(INPUT_NAME);

    if (typeof input === "string") {
      const parsed = parseShoppingItemInput(input, data);
      addItemMutation.mutate(parsed);
      console.log(parsed);
      event.currentTarget.reset();
    }
  }

  const addItemMutation = useMutation({
    mutationFn: async (item: AddShoppingItem) => {
      const response = await addShoppingItem(item);
      if (!response.ok) {
        throw new Error("Failed to add item");
      }
      return await response.json();
    },
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: shoppingListsQueryKey,
      }),
  });

  if (!shoppingItemsQuery.data) {
    return <div>Loading...</div>;
  }

  return (
    <div className="">
      <ul>
        {shoppingItemsQuery.data.map((item) => (
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

      <form
        onSubmit={(event) => handleSubmit(event, shoppingItemsQuery.data)}
        className="fixed inset-x-0 bottom-0 z-50 p-2 py-4 bg-primary/85 backdrop-blur-sm"
      >
        <Input
          name={INPUT_NAME}
          placeholder="Lägg till vara"
          className="bg-primary-foreground"
        />
      </form>
    </div>
  );
}
