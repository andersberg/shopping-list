import { shoppingItemsClient } from "@backend/routes/ShoppingItems";

export async function getShoppingItems() {
  const res = await shoppingItemsClient.index.$get();
  const items = await res.json();

  return items;
}
