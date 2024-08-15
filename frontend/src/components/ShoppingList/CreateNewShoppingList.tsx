import { cn } from "@/lib/utils";
import { queryClient } from "@/main";
import { useMutation } from "@tanstack/react-query";
import { ResponsiveDialog } from "../ResponsiveDialog";
import { Button, buttonVariants } from "../ui/button";
import { Input } from "../ui/input";
import { createShoppingList } from "./mutations";
import { shoppingListsQueryOptions } from "./shoppingListsQueryOptions";

const NEW_LIST_INPUT_ID = "name";

export function CreateNewShoppingList() {
  const createNewShoppingListMutation = useMutation({
    mutationFn: createShoppingList,
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: shoppingListsQueryOptions.queryKey,
      }),
  });

  return (
    <ResponsiveDialog
      closeText="Stäng"
      description="Skapa ny lista"
      openText={
        <div
          className={cn(
            buttonVariants({ variant: "default", size: "lg" }),
            "w-full text-xl font-bold uppercase tracking-widest"
          )}
        >
          Ny lista
        </div>
      }
      title="Ny lista"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          const formData = new FormData(event.currentTarget);
          const input = formData.get(NEW_LIST_INPUT_ID);

          if (typeof input === "string") {
            createNewShoppingListMutation.mutate({
              name: input,
            });
          }
        }}
        className="flex gap-2"
      >
        <Input
          id={NEW_LIST_INPUT_ID}
          name={NEW_LIST_INPUT_ID}
          placeholder="Listans namn"
        />
        <Button type="submit">Skapa</Button>
      </form>
    </ResponsiveDialog>
  );
}
