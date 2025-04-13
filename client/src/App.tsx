import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { GroceryInput } from "./components/GroceryInput";
import { useGroceryList } from "./queries";
import { useMinLoadingTime } from "./useMinLoadingTime";

const UPDATED_NOTIFICATION_DURATION_MS = 2_000;
const LOADING_DELAYED_DURATION_MS = 500;

export function App() {
	const { query, add_mutation, update_mutation, delete_mutation } =
		useGroceryList();
	const { data, isLoading, error, dataUpdatedAt, isFetched } = query;
	const { isPending: is_adding, variables: added_item } = add_mutation;
	const { isPending: is_updating, variables: updating_item } = update_mutation;
	const { isPending: is_deleting, variables: deleting_id } = delete_mutation;
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

	const items_sorted = useMemo(() => {
		return [...(data?.items ?? [])].sort((a, b) => {
			// First sort by checked status
			if (a.checked !== b.checked) {
				return a.checked ? 1 : -1;
			}
			// Then by updated_at in descending order
			return b.updated_at.getTime() - a.updated_at.getTime();
		});
	}, [data?.items]);

	return (
		<div className="app">
			<header>
				<GroceryInput on_add_item={add_grocery_item} />
			</header>
			<main>
				{is_loading_delayed ? (
					<div className="placeholder">
						<h2>Laddar...</h2>
					</div>
				) : items_sorted.length === 0 ? (
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
							{is_adding && added_item && (
								<li className="grocery-item optimistic">
									<dl>
										<dt>Vara:</dt>
										<dd>{added_item.name}</dd>
									</dl>
									<dl>
										<dt>Tillagd:</dt>
										<dd>{new Date().toLocaleString("sv-SE")}</dd>
									</dl>
									<dl>
										<dt>Köpt:</dt>
										<dd>
											<input
												type="checkbox"
												disabled
												checked={false}
											/>
										</dd>
									</dl>
								</li>
							)}
							{items_sorted.map((grocery) => {
								// Skip item if it's being deleted
								if (is_deleting && deleting_id === grocery.id) {
									return null;
								}

								// Apply optimistic update if item is being updated
								const is_being_updated =
									is_updating &&
									updating_item &&
									updating_item.id === grocery.id;

								const displayed_item = is_being_updated
									? { ...grocery, checked: updating_item.updates.checked }
									: grocery;

								return (
									<li
										key={grocery.id}
										className={[
											"grocery-item",
											displayed_item.checked && "added",
											is_being_updated && "optimistic",
										]
											.filter(Boolean)
											.join(" ")}
										style={is_being_updated ? { opacity: 0.7 } : undefined}
									>
										<dl>
											<dt>Vara:</dt>
											<dd>{displayed_item.name}</dd>
										</dl>

										<dl>
											<dt>Antal:</dt>
											<dd>{displayed_item.quantity}</dd>
										</dl>

										{displayed_item.unit && (
											<dl>
												<dt>Enhet:</dt>
												<dd>{displayed_item.unit}</dd>
											</dl>
										)}

										{displayed_item.comment && (
											<dl>
												<dt>Kommentar:</dt>
												<dd>{displayed_item.comment}</dd>
											</dl>
										)}

										{displayed_item.discount_price && (
											<dl>
												<dt>Rabatt:</dt>
												<dd>
													{displayed_item.discount_price.quantity} för{" "}
													{displayed_item.discount_price.price}{" "}
													{displayed_item.discount_price.currency}
												</dd>
											</dl>
										)}

										<dl>
											<dt>Tillagd:</dt>
											<dd>
												{displayed_item.created_at.toLocaleString("sv-SE")}
											</dd>
										</dl>

										<dl>
											<dt>Uppdaterad:</dt>
											<dd>
												{displayed_item.updated_at.toLocaleString("sv-SE")}
											</dd>
										</dl>

										<dl>
											<dt>Köpt:</dt>
											<dd>
												<input
													type="checkbox"
													checked={displayed_item.checked}
													onChange={(e) =>
														handleToggleCheck(grocery.id, e.target.checked)
													}
													disabled={is_being_updated}
												/>
											</dd>
										</dl>

										<dl>
											<dt>Radera:</dt>
											<dd>
												<button
													type="button"
													onClick={() => handleDelete(grocery.id)}
													disabled={is_being_updated}
												>
													Radera
												</button>
											</dd>
										</dl>
									</li>
								);
							})}
						</ul>
					</div>
				)}
				<h1>🛒</h1>
			</main>
		</div>
	);
}
