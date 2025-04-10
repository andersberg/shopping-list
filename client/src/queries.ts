import { QueryClient, useMutation, useQuery } from "@tanstack/react-query";
import type { GroceryItemInput } from "lib/api/grocery-list";
import { api_client } from "./api-client";

export const query_client = new QueryClient();

export function useGroceryList() {
	const query = useQuery({
		queryKey: ["grocery-list"],
		queryFn: async () => {
			const res = await api_client["grocery-list"].$get();
			return res.json();
		},
	});

	const mutation = useMutation({
		mutationFn: (input: GroceryItemInput) =>
			api_client["grocery-list"].add.$post({
				json: { input },
			}),
		onSuccess: () => {
			query.refetch();
		},
	});

	return {
		query,
		mutation,
	};
}
