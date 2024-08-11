import { EllipsisHorizontalIcon } from "@heroicons/react/24/outline";
import { ShoppingItem } from "@server/lib/ShoppingItem";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveDialog } from "../ResponsiveDialog";
import { DeleteItemButton } from "./DeleteItemButton";
import { shoppingItemQueryOptions } from "./shoppingItemQueryOptions";
import { shoppingItemsQueryOptions } from "./shoppingItemsQueryOptions";
import { UpdateItemForm } from "./UpdateItemForm";

const INPUT_NAME = "delete-item-id";

export function ShoppingItemsList() {
  const { data: shoppingItems } = useQuery(shoppingItemsQueryOptions);

  if (!shoppingItems) {
    return <div>Loading...</div>;
  }

  return (
    <div className="">
      <ul className="divide-y">
        {shoppingItems.map((item) => (
          <li key={item.id} className="py-2">
            <ShoppingItemsListItem itemId={item.id} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ShoppingItemsListItem({ itemId }: { itemId: ShoppingItem["id"] }) {
  const { data: item } = useQuery(shoppingItemQueryOptions(itemId));

  if (!item) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex items-center gap-4">
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
        <UpdateItemForm item={item} />
      </ResponsiveDialog>

      <DeleteItemButton inputName={INPUT_NAME} itemId={item.id} />
    </div>
  );
}
