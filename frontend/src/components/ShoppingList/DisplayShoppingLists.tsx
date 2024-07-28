import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { shoppingListsQueryOptions } from "./shoppingListsQueryOptions";

export function DisplayShoppingLists() {
  const shoppingListsQuery = useQuery(shoppingListsQueryOptions);

  if (!shoppingListsQuery.data) {
    return <div>Loading...</div>;
  }
  return (
    <ul>
      {shoppingListsQuery.data.map((list) => (
        <li key={list.id}>
          <Link to="/$listId" params={{ listId: list.id }}>
            {list.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
