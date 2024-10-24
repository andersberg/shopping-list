<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import type { Units, UNITS } from '$lib/constants';
	import { selectListItemSchema, type ListItem } from '$lib/db/schema/listItems';
	import { formatUTCToTimezone } from '$lib/formatUTCToTimezone';
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';

	export let item: ListItem;
	export let units: Units;
	export let handleClose: (event: Event) => void;
	export let handleDelete: () => void;
	export let handleSubmit: () => void;

	const {
		enhance: editItemFormEnhance,
		form: editItemForm,
		reset
	} = superForm(item, {
		validators: zod(selectListItemSchema),
		onResult: ({ result }) => {
			if (result.type === 'success') {
				handleSubmit();
			}
		}
	});
</script>

<header>
	<h2>Edit: {$editItemForm.name}</h2>
	<button
		on:click={(event) => {
			reset();
			if (handleClose) {
				handleClose(event);
			}
		}}>Close</button
	>
</header>

<form method="POST" action="?/updateItem" use:editItemFormEnhance>
	<input type="hidden" name="id" bind:value={$editItemForm.id} />
	<input type="hidden" name="listId" bind:value={$editItemForm.listId} />

	<label>
		<p>Name</p>
		<input type="text" name="name" placeholder="Item name" bind:value={$editItemForm.name} />
	</label>

	<label>
		<p>Quantity</p>
		<input
			type="number"
			name="quantity"
			placeholder="Quantity"
			bind:value={$editItemForm.quantity}
		/>
	</label>

	<label>
		<p>Unit</p>
		<select name="unit" bind:value={$editItemForm.unit}>
			{#each units as unit}
				<option value={unit}>{unit}</option>
			{/each}
		</select>
	</label>

	<label>
		<p>Comment</p>
		<input type="text" name="comment" placeholder="Comment" bind:value={$editItemForm.comment} />
	</label>

	<p>Created: {formatUTCToTimezone($editItemForm.created)}</p>
	<p>Updated: {formatUTCToTimezone($editItemForm.updated)}</p>

	<button type="submit">Save</button>
</form>

<footer>
	<form
		method="POST"
		action="?/deleteItem"
		use:enhance={() => {
			return ({ result }) => {
				if (result.type === 'success') {
					reset();
					handleDelete();
				}
			};
		}}
	>
		<input type="hidden" name="id" value={$editItemForm.id} />
		<button type="submit">Delete</button>
	</form>
</footer>

<style>
</style>
