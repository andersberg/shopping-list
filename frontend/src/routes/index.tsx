import { CreateNewShoppingList } from "@/components/ShoppingList/CreateNewShoppingList";
import { DisplayShoppingLists } from "@/components/ShoppingList/DisplayShoppingLists";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: () => (
    <div className="h-full grid grid-rows-[1fr_auto] gap-4">
      <DisplayShoppingLists />
      <CreateNewShoppingList />
    </div>
  ),
});
