import { ListsApi } from "@/lib/api";
import { AddShoppingItem, ShoppingItem } from "@server/lib/ShoppingItem";
import { CreateShoppingList, ShoppingList } from "@server/lib/ShoppingList";

export async function createShoppingList(list: CreateShoppingList) {
  const response = await ListsApi["new"].$post({
    json: list,
  });

  if (!response.ok) {
    throw new Error("Failed to create list");
  }
  return await response.json();
}

export async function deleteShoppingList(listId: ShoppingList["id"]) {
  const response = await ListsApi[":listId"].$delete({
    param: { listId },
  });

  if (!response.ok) {
    throw new Error("Failed to delete list");
  }
  return await response.json();
}

export async function addShoppingItemToList(
  listId: ShoppingList["id"],
  item: ShoppingItem | AddShoppingItem
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
  item: ShoppingItem
) {
  const response = await ListsApi[":listId"].item[":itemId"].$delete({
    param: { listId, itemId: item.id },
  });

  if (!response.ok) {
    throw new Error("Failed to delete item");
  }
  return await response.json();
}

export async function updateShoppingListItem(
  listId: ShoppingList["id"],
  item: ShoppingItem
) {
  const response = await ListsApi[":listId"].item[":itemId"].$put({
    param: {
      listId,
      itemId: item.id,
    },
    json: item,
  });

  if (!response.ok) {
    throw new Error("Failed to update item");
  }

  return await response.json();
}
