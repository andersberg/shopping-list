import { ShoppingItemWithoutId } from "@backend/lib/ShoppingItem";
import { shoppingItemsClient } from "@backend/routes/ShoppingItems";

export async function addShoppingItem(item: ShoppingItemWithoutId) {
  return await shoppingItemsClient.index.$post({
    json: item,
  });
}
