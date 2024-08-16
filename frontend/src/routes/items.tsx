import { ResponsiveDialog } from "@/components/ResponsiveDialog";
import { AddShoppingItemForm } from "@/components/ShoppingItems/AddShoppingItemForm";
import { EditItemForm } from "@/components/ShoppingItems/EditItemForm";
import {
  addOrUpdateShoppingItem,
  deleteShoppingItem,
  updateShoppingItem,
} from "@/components/ShoppingItems/mutations";
import { shoppingItemsQueryOptions } from "@/components/ShoppingItems/shoppingItemsQueryOptions";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/main";
import { EllipsisHorizontalIcon } from "@heroicons/react/24/outline";
import { TrashIcon } from "@radix-ui/react-icons";
import { ShoppingItem } from "@server/lib/ShoppingItem";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/items")({
  component: ShoppingItems,
});

function ShoppingItems() {
  const addNewShoppingItemMutation = useMutation({
    mutationFn: addOrUpdateShoppingItem,
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: shoppingItemsQueryOptions.queryKey,
      }),
  });

  const { data: shoppingItems } = useQuery(shoppingItemsQueryOptions);

  const editListItemMutation = useMutation({
    mutationFn: updateShoppingItem,
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: shoppingItemsQueryOptions.queryKey,
      }),
  });

  const removeListItemMutation = useMutation({
    mutationFn: async (item: ShoppingItem) => deleteShoppingItem(item.id),
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: shoppingItemsQueryOptions.queryKey,
      }),
  });

  if (!shoppingItems) {
    return <div>Loading...</div>;
  }

  return (
    <div data-component="ShoppingItems">
      <ul className="divide-y">
        {shoppingItems.map((item) => (
          <li key={item.id} className="flex items-center gap-4 py-2">
            <p className="space-x-[1ch]">
              <span>{item.quantity}</span>
              <span>{item.unit}</span>
              <span>{item.displayName}</span>
              {item.comment && <span>{item.comment}</span>}
            </p>
            <p className="text-xs">{item.id}</p>

            <ResponsiveDialog
              closeText="Stäng"
              description="Ändra standardvärden för varan"
              openText={<EllipsisHorizontalIcon className="w-4 h-4" />}
              title={item.displayName}
            >
              <EditItemForm item={item} onEdit={editListItemMutation.mutate} />
            </ResponsiveDialog>

            <Button
              variant={"ghost"}
              size={"sm"}
              onClick={() => removeListItemMutation.mutate(item)}
            >
              <TrashIcon className="text-destructive size-4" />
            </Button>
          </li>
        ))}
      </ul>

      <AddShoppingItemForm handleMutate={addNewShoppingItemMutation.mutate} />
    </div>
  );
}
