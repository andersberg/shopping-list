import {
	QueryClient,
	queryOptions,
	useMutation,
	useQuery,
} from "@tanstack/react-query";
import type { GroceryListItem } from "lib/GroceryItem";
import type { GroceryItemInput } from "lib/api/grocery-list";
import { api_client } from "./api-client";

export const query_client = new QueryClient();

const grocery_list_query_key = ["grocery-list"];

const grocery_list_query_options = queryOptions({
	queryKey: grocery_list_query_key,
	queryFn: async () => {
		const res = await api_client["grocery-list"].$get();
		return res.json();
	},
});

export function useGroceryList() {
	const query = useQuery(grocery_list_query_options);

	const mutation = useMutation({
		mutationKey: ["grocery-list:add"],
		mutationFn: (input: GroceryItemInput) =>
			api_client["grocery-list"].add
				.$post({
					json: { input },
				})
				.then((res) => res.json()),
		onSuccess: (newItem) => {
			query_client.setQueryData(
				grocery_list_query_key,
				(oldList: GroceryListItem[] = []) => {
					return [newItem, ...oldList];
				},
			);
		},
	});

	return {
		query,
		mutation,
	};
}
