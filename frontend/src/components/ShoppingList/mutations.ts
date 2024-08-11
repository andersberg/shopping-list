import { ListsApi } from "@/lib/api";
import { AddShoppingItem } from "@server/lib/ShoppingItem";

export async function addShoppingItemToList(item: AddShoppingItem) {
  const response = await ListsApi.$post({
    json: item,
  });

  if (!response.ok) {
    throw new Error("Failed to add item");
  }
  return await response.json();
}
