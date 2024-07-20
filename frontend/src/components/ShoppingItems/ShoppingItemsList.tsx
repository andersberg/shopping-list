import { parseShoppingItemInput } from "@/lib/parseShoppingItemInput";
import { ShoppingItem } from "@backend/lib/ShoppingItem";
import { useQuery } from "@tanstack/react-query";
import { Input } from "../ui/input";
import { getShoppingItems } from "./resources";

const INPUT_NAME = "input";

export function ShoppingItemsList() {
  const shoppingListsQuery = useQuery<ShoppingItem[]>({
    queryKey: ["shopping-items"],
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

      console.log(parsed);
    }
  }

  if (!shoppingListsQuery.data) {
    return <div>Loading...</div>;
  }

  return (
    <div className="">
      <ul>
        {shoppingListsQuery.data.map((item) => (
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
        onSubmit={(event) => handleSubmit(event, shoppingListsQuery.data)}
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
