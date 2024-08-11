import { parseShoppingItemInput } from "@/lib/parseShoppingItemInput";
import { AddShoppingItem, ShoppingItem } from "@server/lib/ShoppingItem";
import { useQuery } from "@tanstack/react-query";
import { Input } from "../ui/input";
import { shoppingItemsQueryOptions } from "./shoppingItemsQueryOptions";

const INPUT_NAME = "value";

export function AddShoppingItemForm({
  className,
  handleMutate,
}: {
  className?: string;
  handleMutate: (item: AddShoppingItem) => void;
}) {
  const shoppingItemsQuery = useQuery(shoppingItemsQueryOptions);

  function handleOnSubmit(
    event: React.FormEvent<HTMLFormElement>,
    data: ShoppingItem[]
  ) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const input = formData.get(INPUT_NAME);

    if (typeof input === "string") {
      const parsed = parseShoppingItemInput(input, data);
      handleMutate(parsed);
      event.currentTarget.reset();
    }
  }

  if (!shoppingItemsQuery.data) {
    return <div>Loading...</div>;
  }

  return (
    <form
      onSubmit={(event) => handleOnSubmit(event, shoppingItemsQuery.data)}
      className={className}
    >
      <Input
        name={INPUT_NAME}
        placeholder="Lägg till vara"
        // className="bg-primary-foreground"
      />
    </form>
  );
}
