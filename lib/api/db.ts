import type { ParsedGroceryItem } from "../GroceryInputParser/Parser";
import type { GroceryListItem } from "../GroceryItem";
import { sort_grocery_list_items } from "../GroceryItem";

class GroceryListDb {
	private items = new Map<string, GroceryListItem>();

	public add_item(parsedItem: ParsedGroceryItem) {
		const id = crypto.randomUUID();
		const item = {
			...parsedItem,
			id,
			added_at: new Date(),
			updated_at: new Date(),
			checked: false,
		};

		this.items.set(id, item);

		return item;
	}

	public get_items() {
		return sort_grocery_list_items([...this.items.values()]);
	}

	public get_item(id: string) {
		return this.items.get(id);
	}

	public update_item(id: string, item: GroceryListItem) {
		this.items.set(id, item);

		return item;
	}

	public delete_item(id: string) {
		this.items.delete(id);
	}
}

export const grocery_list_db = new GroceryListDb();
