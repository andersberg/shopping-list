import { queryClient } from "@/main";
import { EllipsisHorizontalIcon, TrashIcon } from "@heroicons/react/24/outline";
import { ShoppingItem } from "@server/lib/ShoppingItem";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ResponsiveDialog } from "../ResponsiveDialog";
import { DeleteItemButton } from "./DeleteItemButton";
import { deleteShoppingItem } from "./mutations";
import { shoppingItemQueryOptions } from "./shoppingItemQueryOptions";
import { shoppingItemsQueryOptions } from "./shoppingItemsQueryOptions";

const INPUT_NAME = "delete-item-id";

export function ShoppingItemsList() {
  const { data: shoppingItems } = useQuery(shoppingItemsQueryOptions);

  if (!shoppingItems) {
    return <div>Loading...</div>;
  }

  return (
    <div className="">
      <ul>
        {shoppingItems.map((item) => (
          <li key={item.id} className="flex items-center gap-4">
            <p className="space-x-[1ch]">
              <span>{item.quantity}</span>
              <span>{item.unit}</span>
              <span>{item.displayName}</span>
              {item.comment && <span>{item.comment}</span>}
            </p>

            <ResponsiveDialog
              closeText="Close"
              description="Update item"
              openText="Edit"
              title="Edit item"
            >
              <UpdateItem itemId={item.id} />
            </ResponsiveDialog>

            <DeleteItemButton inputName={INPUT_NAME} itemId={item.id} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function UpdateItem({ itemId }: { itemId: ShoppingItem["id"] }) {
  const { data: shoppingItem } = useQuery(shoppingItemQueryOptions(itemId));

  if (!shoppingItem) {
    return <div>Loading...</div>;
  }

  return <span>UpdateItem</span>;
}
