import { DisplayShoppingLists } from "@/components/ShoppingList/DisplayShoppingLists";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: () => <DisplayShoppingLists />,
});
