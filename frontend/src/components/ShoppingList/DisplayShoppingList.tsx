import { Route as ListRoute } from "@/routes/$listId";
import { useQuery } from "@tanstack/react-query";
import { shoppingListQueryOptions } from "./shoppingListQueryOptions";

export function DisplayShoppingList() {
  const { listId } = ListRoute.useParams();
  const { data: list } = useQuery(shoppingListQueryOptions(listId));

  if (!list) {
    return <div>Loading...</div>;
  }

  return (
    <main>
      <header>
        <h2>{list.name}</h2>
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
        <form></form>
      </footer>
    </main>
  );
}
