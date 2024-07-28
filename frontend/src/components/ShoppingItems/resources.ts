import { ItemsApi } from "@/lib/api";

export async function getShoppingItems() {
  const res = await ItemsApi.$get();
  const items = await res.json();

  return items;
}
