import { shoppingListQueryOptions } from "@/components/ShoppingList/shoppingListQueryOptions";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$listId")({
  loader: async ({ context: { queryClient }, params }) => {
    const listId = params.listId;
    const queryOptions = shoppingListQueryOptions(listId);

    return queryClient.ensureQueryData(queryOptions);
  },
  component: () => <div>Hello /$listId!</div>,
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
        <h2>{list}</h2>
      </header>
    </main>
  );
}
