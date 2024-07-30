import { shoppingListQueryOptions } from "@/components/ShoppingList/shoppingListQueryOptions";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$listId")({
  loader: async ({ context: { queryClient }, params }) => {
    const listId = params.listId;
    const queryOptions = shoppingListQueryOptions(listId);

    return queryClient.ensureQueryData(queryOptions);
  },
  component: ShoppingList,
});

function ShoppingList() {
  const { listId } = Route.useParams();
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
    </main>
  );
}
