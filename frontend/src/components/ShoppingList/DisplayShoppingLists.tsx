import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { shoppingListsQueryOptions } from "./shoppingListsQueryOptions";

export function DisplayShoppingLists() {
  const shoppingListsQuery = useQuery(shoppingListsQueryOptions);

  if (!shoppingListsQuery.data) {
    return <div>Loading...</div>;
  }
  return (
    <ul className="divide-y ">
      {shoppingListsQuery.data.map((list) => (
        <li key={list.id} className="py-2">
          <Link
            to="/$listId"
            params={{ listId: list.id }}
            className="text-2xl font-medium uppercase text-primary"
          >
            {list.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
