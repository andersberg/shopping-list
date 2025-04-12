import {
	QueryClient,
	queryOptions,
	useMutation,
	useQuery,
} from "@tanstack/react-query";
import type { GroceryList } from "lib/GroceryItem";
import type { GroceryItemInput, GroceryListItemUpdate } from "lib/api/schema";
import { api_client, grocery_list_client } from "./api-client";

export const query_client = new QueryClient();

const grocery_list_query_key = ["grocery-list"];

const grocery_list_query_options = queryOptions({
	queryKey: grocery_list_query_key,
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
});

export function useGroceryList() {
	const query = useQuery(grocery_list_query_options);

	const add_mutation = useMutation({
		mutationKey: ["grocery-list:add"],
		mutationFn: async (input: GroceryItemInput) => {
			const res = await api_client["grocery-list"].items.add.$post({
				json: { input },
			});
			if (!res.ok) {
				throw new Error("Failed to add item");
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
			const { item, status } = data;
			query_client.setQueryData(
				grocery_list_query_key,
				(oldData: GroceryList | undefined) => {
					if (status === "created") {
						return {
							...oldData,
							items: [item, ...(oldData?.items ?? [])],
						};
					}
					// For updates, replace the existing item
					return {
						...oldData,
						items:
							oldData?.items.map((existingItem) =>
								existingItem.id === item.id ? item : existingItem,
							) ?? [],
					};
				},
			);

			query_client.invalidateQueries({
				queryKey: grocery_list_query_key,
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
				grocery_list_query_key,
				(oldData: GroceryList | undefined) => ({
					...oldData,
					items:
						oldData?.items.map((existingItem) =>
							existingItem.id === item.id ? item : existingItem,
						) ?? [],
				}),
			);
			query_client.invalidateQueries({
				queryKey: grocery_list_query_key,
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
				grocery_list_query_key,
				(oldData: GroceryList | undefined) => ({
					...oldData,
					items: oldData?.items.filter((item) => item.id !== deletedId) ?? [],
				}),
			);
			query_client.invalidateQueries({
				queryKey: grocery_list_query_key,
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
