import {
	QueryClient,
	queryOptions,
	useMutation,
	useQuery,
} from "@tanstack/react-query";
import type { GroceryList } from "lib/grocery-item";
import {
	type GroceryListItemUpdate,
	grocery_item_input_schema,
} from "lib/api/schema";
import type { ParsedGroceryItem } from "../../lib/grocery-input-parser/parser";
import { api_client, grocery_list_client } from "./api-client";

export const query_client = new QueryClient();

const GROCERY_LIST_QUERY_KEY = ["grocery-list"];

const QUERY_REFETCH_INTERVAL_MS = 30_000;

const grocery_list_query_options = queryOptions({
	queryKey: GROCERY_LIST_QUERY_KEY,
	queryFn: async () => {
		const res = await grocery_list_client.index.$get();
		if (!res.ok) {
			throw new Error("Failed to fetch grocery list");
		}
		const data = await res.json();
		return {
			...data,
			items: data.items.map((item) => ({
				...item,
				created_at: new Date(item.created_at),
				updated_at: new Date(item.updated_at),
			})),
		};
	},
	refetchInterval: QUERY_REFETCH_INTERVAL_MS,
	refetchIntervalInBackground: true,
});

export function useGroceryList() {
	const query = useQuery(grocery_list_query_options);

	const add_mutation = useMutation({
		mutationKey: ["grocery-list:add"],
		mutationFn: async (item: ParsedGroceryItem) => {
			// Validate the parsed item against our schema
			const validated_grocery_item = grocery_item_input_schema.parse(item);

			const res = await api_client["grocery-list"].items.add.$post({
				json: { item: validated_grocery_item },
			});
			if (!res.ok) {
				throw new Error("Failed to add item");
			}
			return res.json();
		},
		onSettled: () => {
			query_client.invalidateQueries({
				queryKey: GROCERY_LIST_QUERY_KEY,
			});
		},
	});

	const update_mutation = useMutation({
		mutationKey: ["grocery-list:update"],
		mutationFn: async ({
			id,
			updates,
		}: { id: string; updates: GroceryListItemUpdate }) => {
			const res = await api_client["grocery-list"].items[":id"].$patch({
				param: { id },
				json: updates,
			});
			if (!res.ok) {
				throw new Error("Failed to update item");
			}
			const data = await res.json();
			return {
				...data,
				item: {
					...data.item,
					created_at: new Date(data.item.created_at),
					updated_at: new Date(data.item.updated_at),
				},
			};
		},
		onSuccess: (data) => {
			const { item } = data;
			query_client.setQueryData(
				GROCERY_LIST_QUERY_KEY,
				(oldData: GroceryList | undefined) => ({
					...oldData,
					items:
						oldData?.items.map((existingItem) =>
							existingItem.id === item.id ? item : existingItem,
						) ?? [],
				}),
			);
			query_client.invalidateQueries({
				queryKey: GROCERY_LIST_QUERY_KEY,
			});
		},
	});

	const delete_mutation = useMutation({
		mutationKey: ["grocery-list:delete"],
		mutationFn: async (id: string) => {
			const res = await api_client["grocery-list"].items[":id"].$delete({
				param: { id },
			});
			if (!res.ok) {
				throw new Error("Failed to delete item");
			}
			return res.json();
		},
		onSuccess: (_, deletedId) => {
			query_client.setQueryData(
				GROCERY_LIST_QUERY_KEY,
				(oldData: GroceryList | undefined) => ({
					...oldData,
					items: oldData?.items.filter((item) => item.id !== deletedId) ?? [],
				}),
			);
			query_client.invalidateQueries({
				queryKey: GROCERY_LIST_QUERY_KEY,
			});
		},
	});

	return {
		query,
		add_mutation,
		update_mutation,
		delete_mutation,
	};
}
