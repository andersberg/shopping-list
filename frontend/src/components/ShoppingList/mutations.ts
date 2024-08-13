import { ListsApi } from "@/lib/api";
import { AddShoppingItem, ShoppingItem } from "@server/lib/ShoppingItem";
import { ShoppingList } from "@server/lib/ShoppingList";

export async function addShoppingItemToList(
  listId: ShoppingList["id"],
  item: AddShoppingItem
) {
  const response = await ListsApi[":listId"].item.$post({
    param: { listId },
    json: item,
  });

  if (!response.ok) {
    throw new Error("Failed to add item");
  }
  return await response.json();
}

export async function removeShoppingItemFromList(
  listId: ShoppingList["id"],
  itemId: ShoppingItem["id"]
) {
  const response = await ListsApi[":listId"].item[":itemId"].$delete({
    param: { listId, itemId },
  });

  if (!response.ok) {
    throw new Error("Failed to delete item");
  }
  return await response.json();
}
