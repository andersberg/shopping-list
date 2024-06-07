import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "./components/ui/input";

const FormSchema = z.object({
  item: z.string().min(2, {
    message: "Item must be at least 2 characters.",
  }),
});

export function ShoppingList() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      item: "",
    },
  });

  function handleSubmit(data: z.infer<typeof FormSchema>) {
    console.log(data);
  }

  return (
    <div className="flex flex-col items-center justify-center h-svh">
      <main className="grow">
        <h1 className="text-3xl font-bold">Shopping List</h1>
      </main>
      <Form {...form}>
        <form
          className="flex w-full max-w-sm items-center gap-1.5 px-1 py-2"
          onSubmit={form.handleSubmit(handleSubmit)}
        >
          <FormField
            control={form.control}
            name="item"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormControl>
                    <Input {...field} placeholder="Add item" />
                  </FormControl>
                </FormItem>
              );
            }}
          />
          <Button type="submit">Add</Button>
        </form>
      </Form>
    </div>
  );
}
