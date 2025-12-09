import {
	GROCERY_ITEM_KNOWN_UNITS,
	GROCERY_ITEM_MODIFIERS,
} from "lib/constants";
import type { ParsedGroceryItem } from "lib/grocery-input-parser/parser";
import { GroceryInputParser } from "lib/grocery-input-parser/parser";
import { useRef, useState } from "react";

const parser = new GroceryInputParser(
	GROCERY_ITEM_KNOWN_UNITS,
	GROCERY_ITEM_MODIFIERS,
);

interface GroceryInputProps {
	on_add_item: (item: ParsedGroceryItem) => void;
}

export function GroceryInput({ on_add_item }: GroceryInputProps) {
	const [input_value, set_input_value] = useState("");
	const form_ref = useRef<HTMLFormElement>(null);

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!input_value.trim()) return;

		const parsed_item = parser.parse(input_value.trim());
		on_add_item(parsed_item);
		set_input_value("");
		form_ref.current?.reset();
	}

	return (
		<form
			ref={form_ref}
			onSubmit={handleSubmit}
		>
			<div className="input-wrapper">
				<input
					type="text"
					name="input"
					value={input_value}
					onChange={(e) => set_input_value(e.target.value)}
					placeholder='"1 kg mjöl"'
					enterKeyHint="send"
				/>
				<button
					type="button"
					onClick={() => {
						set_input_value("");
						form_ref.current?.reset();
					}}
				>
					Rensa
				</button>
			</div>
			<button type="submit">Lägg till</button>
		</form>
	);
}
