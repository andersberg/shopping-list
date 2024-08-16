import { cn } from "@/lib/utils";
import { queryClient } from "@/main";
import { Route as ListRoute } from "@/routes/$listId";
import {
  EllipsisHorizontalIcon,
  PencilIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { AddShoppingItem, ShoppingItem } from "@server/lib/ShoppingItem";
import { useMutation, useQuery } from "@tanstack/react-query";
import { PropsWithChildren, useState } from "react";
import { RemoveListItemButton } from "../Lists/RemoveListItemButton";
import { ResponsiveDialog } from "../ResponsiveDialog";
import { AddShoppingItemForm } from "../ShoppingItems/AddShoppingItemForm";
import { EditItemForm } from "../ShoppingItems/EditItemForm";
import { shoppingItemsQueryOptions } from "../ShoppingItems/shoppingItemsQueryOptions";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  addShoppingItemToList,
  removeShoppingItemFromList,
  updateShoppingList,
  updateShoppingListItem,
} from "./mutations";
import { shoppingListQueryOptions } from "./shoppingListQueryOptions";
import { shoppingListsQueryOptions } from "./shoppingListsQueryOptions";

export function ViewShoppingList() {
  const { listId } = ListRoute.useParams();
  const listQueryOptions = shoppingListQueryOptions(listId);
  const { data: list } = useQuery(listQueryOptions);
  const { data: items } = useQuery(shoppingItemsQueryOptions);

  const addShoppingItemMutation = useMutation({
    mutationFn: async (item: ShoppingItem | AddShoppingItem) =>
      addShoppingItemToList(listId, item),
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: shoppingListQueryOptions(listId).queryKey,
      }),
  });

  const editListItemMutation = useMutation({
    mutationFn: async (item: ShoppingItem) =>
      updateShoppingListItem(listId, item),
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: shoppingListQueryOptions(listId).queryKey,
      }),
  });

  const removeListItemMutation = useMutation({
    mutationFn: async (item: ShoppingItem) =>
      removeShoppingItemFromList(listId, item),
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: shoppingListQueryOptions(listId).queryKey,
      }),
  });

  const updateListMutation = useMutation({
    mutationFn: updateShoppingList,
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: shoppingListsQueryOptions.queryKey,
      }),
  });

  if (!list) {
    return <div>Loading...</div>;
  }

  return (
    <main className="space-y-4">
      <header className="py-4">
        <EditableHeader
          text={list.name}
          onSave={(name) => updateListMutation.mutate({ ...list, name })}
        />
      </header>
      <ul>
        {list.items.map((item) => (
          <li key={item.id} className="flex gap-4">
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

            <RemoveListItemButton
              onClick={() => removeListItemMutation.mutate(item)}
            />
          </li>
        ))}
      </ul>

      {items && (
        <div>
          <h3 className="text-xl font-bold uppercase">Varor</h3>
          <ul className="space-y-4">
            {items.map((item) => (
              <li key={item.id} className="flex gap-4">
                <p className="space-x-[1ch]">
                  <span>{item.quantity}</span>
                  <span>{item.unit}</span>
                  <span>{item.displayName}</span>
                </p>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    addShoppingItemMutation.mutate(item);
                  }}
                >
                  <Button size="icon" type="submit" className="size-6">
                    <PlusIcon className="size-4" />
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      )}

      <footer>
        <AddShoppingItemForm handleMutate={addShoppingItemMutation.mutate} />
      </footer>
    </main>
  );
}

function EditableHeader({
  className,
  text,
  onSave,
}: {
  className?: string;
  text: string;
  onSave: (text: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);

  if (!isEditing) {
    return (
      <div className={cn("flex items-center gap-4", className)}>
        <h2 className="text-2xl font-bold uppercase">{text}</h2>
        <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
          <PencilIcon className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        const formData = new FormData(event.currentTarget);
        const input = formData.get("header");

        if (typeof input === "string" && input.length > 0) {
          onSave(input);
        }

        setIsEditing(false);
      }}
      className={cn("flex items-center gap-4", className)}
    >
      <Input
        id="header"
        name="header"
        type="text"
        defaultValue={text}
        placeholder={text}
      />
      <Button type="submit">Spara</Button>
    </form>
  );
}
