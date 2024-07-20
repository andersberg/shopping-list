import { useQuery } from "@tanstack/react-query";
import { getShoppingItems } from "./resources";

export function ShoppingItemsList() {
  const shoppingListsQuery = useQuery({
    queryKey: ["shopping-items"],
    queryFn: getShoppingItems,
  });

  if (shoppingListsQuery.isLoading) {
    return <div>Loading...</div>;
  }
  return (
    <ul>
      {shoppingListsQuery.data?.map((item) => (
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
  );
}
