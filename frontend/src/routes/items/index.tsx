import { ShoppingItemsList } from "@/components/ShoppingItems/ShoppingItemsList";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/items/")({
  component: ShoppingItems,
});

function ShoppingItems() {
  return (
    <main>
      <header>
        <h1>Shopping Items</h1>
      </header>
      <ShoppingItemsList />
    </main>
  );
}
