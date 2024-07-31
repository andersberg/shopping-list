import { ItemsApi } from "@/lib/api";
import { ShoppingItem } from "@server/lib/ShoppingItem";
import { queryOptions } from "@tanstack/react-query";

export const shoppingItemsQueryOptions = queryOptions<ShoppingItem[]>({
  queryKey: ["items"],
  queryFn: async () => {
    const result = await ItemsApi.$get();
    const data = await result.json();

    return data;
  },
});
