import { ShoppingItems } from "@/components/ShoppingItems/ShoppingItems";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/items")({
  component: ShoppingItems,
});
