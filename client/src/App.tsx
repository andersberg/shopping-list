import { useEffect, useRef, useState } from "react";
import "./App.css";
import { useGroceryList } from "./queries";
import { useMinLoadingTime } from "./useMinLoadingTime";

const UPDATED_NOTIFICATION_DURATION_MS = 2_000;
const LOADING_DELAYED_DURATION_MS = 500;

export function App() {
	const { query, add_mutation, update_mutation, delete_mutation } =
		useGroceryList();
	const { data, isLoading, error, dataUpdatedAt, isFetched } = query;
	const { mutate: add_grocery_item } = add_mutation;
	const { mutate: update_grocery_item } = update_mutation;
	const { mutate: delete_grocery_item } = delete_mutation;

	const [show_update_notification, set_show_update_notification] =
		useState(false);

	// Effect to handle showing update notification
	useEffect(() => {
		if (dataUpdatedAt && isFetched) {
			set_show_update_notification(true);
			const timer = setTimeout(
				() => set_show_update_notification(false),
				UPDATED_NOTIFICATION_DURATION_MS,
			);
			return () => clearTimeout(timer);
		}
	}, [dataUpdatedAt, isFetched]);

	const is_loading_delayed = useMinLoadingTime(
		isLoading,
		LOADING_DELAYED_DURATION_MS,
	);
	const form_ref = useRef<HTMLFormElement>(null);

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form_data = new FormData(event.target as HTMLFormElement);
		const input = form_data.get("input");
		if (!input || input.toString().trim() === "") return;

		add_grocery_item(input.toString().trim());
		form_ref.current?.reset();
	}

	function handleToggleCheck(id: string, checked: boolean) {
		update_grocery_item({
			id,
			updates: { checked },
		});
	}

	function handleDelete(id: string) {
		if (confirm("Är du säker på att du vill ta bort varan?")) {
			delete_grocery_item(id);
		}
	}

	if (error) {
		return <div>Error: {error.message}</div>;
	}

	const items_sorted_by_checked =
		data?.items.sort((a, b) => (a.checked ? 1 : b.checked ? -1 : 0)) ?? [];

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
				{is_loading_delayed ? (
					<div className="placeholder">
						<h2>Laddar...</h2>
					</div>
				) : items_sorted_by_checked.length === 0 ? (
					<div className="placeholder">
						<h2>Inköpslistan "{data?.name}" är tom.</h2>
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
					<div className="grocery-items-wrapper">
						{show_update_notification && !isLoading && (
							<div className="placeholder">Listan har uppdaterats.</div>
						)}
						<ul className="grocery-items">
							{items_sorted_by_checked.map((grocery) => (
								<li
									key={grocery.id}
									className={["grocery-item", grocery.checked && "added"]
										.filter(Boolean)
										.join(" ")}
								>
									<dl>
										<dt>Vara:</dt>
										<dd>{grocery.name}</dd>
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

									<dl>
										<dt>Tillagd:</dt>
										<dd>{grocery.created_at.toLocaleString("sv-SE")}</dd>
									</dl>

									<dl>
										<dt>Uppdaterad:</dt>
										<dd>{grocery.updated_at.toLocaleString("sv-SE")}</dd>
									</dl>

									<dl>
										<dt>Köpt:</dt>
										<dd>
											<input
												type="checkbox"
												checked={grocery.checked}
												onChange={(e) =>
													handleToggleCheck(grocery.id, e.target.checked)
												}
											/>
										</dd>
									</dl>

									<dl>
										<dt>Radera:</dt>
										<dd>
											<button
												type="button"
												onClick={() => handleDelete(grocery.id)}
											>
												Radera
											</button>
										</dd>
									</dl>
								</li>
							))}
						</ul>
					</div>
				)}
				<h1>🛒</h1>
			</main>
		</div>
	);
}
