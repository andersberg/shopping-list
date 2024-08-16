import { EllipsisHorizontalIcon, TrashIcon } from "@heroicons/react/24/outline";
import { ShoppingItem } from "@server/lib/ShoppingItem";
import { ResponsiveDialog } from "../ResponsiveDialog";
import { EditItemForm } from "../ShoppingItems/EditItemForm";
import { Button } from "../ui/button";

export function ShoppingListItem({
  item,
  onDelete,
  onEdit,
}: {
  item: ShoppingItem;
  onDelete: (item: ShoppingItem) => void;
  onEdit: (item: ShoppingItem) => void;
}) {
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
        <EditItemForm item={item} onEdit={onEdit} />
      </ResponsiveDialog>

      <Button variant={"ghost"} size={"sm"} onClick={() => onDelete(item)}>
        <TrashIcon className="text-destructive size-4" />
      </Button>
    </div>
  );
}
