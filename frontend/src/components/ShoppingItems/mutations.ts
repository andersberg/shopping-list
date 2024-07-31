import { ItemsApi } from "@/lib/api";
import { AddShoppingItem, ShoppingItem } from "@server/lib/ShoppingItem";

export async function addNewShoppingItem(item: AddShoppingItem) {
  const response = await ItemsApi.$post({
    json: item,
  });

  if (!response.ok) {
    throw new Error("Failed to add item");
  }
  return await response.json();
}

export async function deleteShoppingItem(id: ShoppingItem["id"]) {
  const response = await ItemsApi[":id"].$delete({
    param: { id },
  });

  if (!response.ok) {
    throw new Error("Failed to delete item");
  }

  return await response.json();
}

export async function updateShoppingItem(item: ShoppingItem) {
  const response = await ItemsApi[":id"].$put({
    param: { id: item.id },
    json: item,
  });

  if (!response.ok) {
    throw new Error("Failed to update item");
  }

  return await response.json();
}
