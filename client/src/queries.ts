import {
	QueryClient,
	queryOptions,
	useMutation,
	useQuery,
} from "@tanstack/react-query";
import type { GroceryList } from "lib/GroceryItem";
import type { GroceryItemInput } from "lib/api/grocery-list";
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
		return res.json();
	},
});

export function useGroceryList() {
	const query = useQuery(grocery_list_query_options);

	const mutation = useMutation({
		mutationKey: ["grocery-list:add"],
		mutationFn: (input: GroceryItemInput) =>
			api_client["grocery-list"].items.add
				.$post({
					json: { input },
				})
				.then((res) => {
					if (!res.ok) {
						throw new Error("Failed to add item");
					}
					return res.json();
				}),
		onSuccess: (newItem) => {
			console.log("onSuccess", newItem);
			query_client.setQueryData(
				grocery_list_query_key,
				(oldData: GroceryList | undefined) => {
					return {
						...oldData,
						items: [newItem, ...(oldData?.items ?? [])],
					};
				},
			);
		},
	});

	return {
		query,
		mutation,
	};
}
