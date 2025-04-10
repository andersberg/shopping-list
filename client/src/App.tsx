import { useRef } from "react";
import "./App.css";
import { useGroceryList } from "./queries";

export function App() {
	const { query, mutation } = useGroceryList();
	const { data: grocery_items, isFetching } = query;
	const { mutate: add_grocery_item } = mutation;

	const form_ref = useRef<HTMLFormElement>(null);

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form_data = new FormData(event.target as HTMLFormElement);
		const input = form_data.get("input");
		if (!input || input.toString().trim() === "") return;

		add_grocery_item(input.toString().trim());
		form_ref.current?.reset();
	}

	return (
		<div className="app">
			<header>
				<form
					ref={form_ref}
					onSubmit={handleSubmit}
				>
					<div className="input-wrapper">
						<input
							type="text"
							name="input"
							placeholder={'"1 kg mjöl"'}
							enterKeyHint="send"
						/>
						<button
							type="button"
							onClick={() => form_ref.current?.reset()}
						>
							Rensa
						</button>
					</div>
					<button type="submit">Lägg till</button>
				</form>
			</header>
			<main>
				{isFetching ? (
					<div className="placeholder">
						<h2>Laddar...</h2>
					</div>
				) : grocery_items?.length === 0 ? (
					<div className="placeholder">
						<h2>Din inköpslista är tom.</h2>
						<p>Lägg till en vara för att börja.</p>
						<h3>Exempel:</h3>
						<ul>
							<li>
								<p>"1 mjölk"</p>
							</li>
							<li>
								<p>"2 kg potatis"</p>
							</li>
							<li>
								<p>"3 paket kaffe eko"</p>
							</li>
							<li>
								<p>"4 st ramlösa 4/50 kr"</p>
							</li>
						</ul>
					</div>
				) : (
					<ul className="grocery-items">
						{grocery_items?.map((grocery) => (
							<li key={grocery.id}>
								<dl>
									<dt>Vara:</dt>
									<dd>{grocery.item}</dd>
								</dl>
								<dl>
									<dt>Antal:</dt>
									<dd>{grocery.quantity}</dd>
								</dl>
								{grocery.unit && (
									<dl>
										<dt>Enhet:</dt>
										<dd>{grocery.unit}</dd>
									</dl>
								)}

								{grocery.comment && (
									<dl>
										<dt>Kommentar:</dt>
										<dd>{grocery.comment}</dd>
									</dl>
								)}

								{grocery.discount_price && (
									<dl>
										<dt>Rabatt:</dt>
										<dd>
											{grocery.discount_price.quantity} för{" "}
											{grocery.discount_price.price}{" "}
											{grocery.discount_price.currency}
										</dd>
									</dl>
								)}
							</li>
						))}
					</ul>
				)}
				<h1>🛒</h1>
			</main>
		</div>
	);
}
