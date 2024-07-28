import { ItemsApi } from "@/lib/api";
import { AddShoppingItem } from "@server/lib/ShoppingItem";

export async function addShoppingItem(item: AddShoppingItem) {
  return await ItemsApi.$post({
    json: item,
  });
}
