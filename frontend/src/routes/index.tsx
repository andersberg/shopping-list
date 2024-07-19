import { ShoppingList } from "@/components/ShoppingList";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: () => <ShoppingList />,
});
