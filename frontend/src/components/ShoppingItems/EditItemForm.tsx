import { Label } from "@radix-ui/react-label";
import { ShoppingItem } from "@server/lib/ShoppingItem";
import { UNITS } from "@server/lib/constants";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { z } from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export function EditItemForm({
  item,
  onEdit,
}: {
  item: ShoppingItem;
  onEdit: (data: ShoppingItem) => void;
}) {
  const form = useForm({
    defaultValues: item,
    validatorAdapter: zodValidator(),
    onSubmit: (data) => {
      onEdit(data.value);
    },
  });

  if (!item) {
    return <div>Loading...</div>;
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-4"
    >
      <form.Field
        name="displayName"
        children={(field) => {
          return (
            <fieldset>
              <Label htmlFor={field.name}>Namn</Label>
              <Input
                type="text"
                id={field.name}
                name={field.name}
                value={field.state.value}
                onChange={(event) =>
                  field.handleChange(event.currentTarget.value)
                }
              />
            </fieldset>
          );
        }}
      />

      <form.Field
        name="unit"
        validators={{
          onChange: z.enum(UNITS),
        }}
        children={(field) => (
          <fieldset>
            <Label htmlFor="unit">Enhet</Label>
            <Select
              value={field.state.value}
              onValueChange={(value) => {
                const newValue = z.enum(UNITS).parse(value);
                field.setValue(newValue);
              }}
            >
              <SelectTrigger id="unit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNITS.map((unit) => (
                  <SelectItem value={unit} key={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </fieldset>
        )}
      />

      <form.Field
        name="quantity"
        children={(field) => (
          <fieldset>
            <Label htmlFor={field.name}>Antal</Label>
            <Input
              type="number"
              id={field.name}
              name={field.name}
              value={field.state.value}
              onChange={(event) => {
                const quantity = Number(event.currentTarget.value);
                field.handleChange(quantity);
              }}
            />
          </fieldset>
        )}
      />

      <form.Field
        name="comment"
        children={(field) => (
          <fieldset>
            <Label htmlFor={field.name}>Kommentar</Label>
            <Input
              type="text"
              id={field.name}
              name={field.name}
              value={field.state.value}
              onChange={(event) =>
                field.handleChange(event.currentTarget.value)
              }
            />
          </fieldset>
        )}
      />

      <fieldset>
        <Label htmlFor={item.id}>Namn</Label>
        <Input
          type="text"
          id={item.id}
          name={item.id}
          defaultValue={item.id}
          readOnly
        />
      </fieldset>

      <Button type="submit">Spara</Button>
    </form>
  );
}
