import { TrashIcon } from "@heroicons/react/24/outline";
import { Button } from "../ui/button";

export function RemoveListItemButton({
  variant = "ghost",
  size = "sm",
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button variant={variant} size={size} onClick={onClick} {...props}>
      <TrashIcon className="text-destructive size-4" />
    </Button>
  );
}
