import { ListsApi } from "@/lib/api";
import { queryOptions } from "@tanstack/react-query";

export const shoppingListsQueryOptions = queryOptions({
  queryKey: ["lists"],
  queryFn: async () => {
    const result = await ListsApi.$get();
    const data = await result.json();

    return data;
  },
});
