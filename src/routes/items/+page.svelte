<script lang="ts">
	import { enhance } from '$app/forms';
	import ShoppingItemForm from '$lib/components/ShoppingItemForm.svelte';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	let openItem: number | undefined;
</script>

<h1>Shopping Items</h1>

<table>
	<thead>
		<tr>
			<th>Name</th>
			<th>Display Name</th>
			<th>Quantity</th>
			<th>Unit</th>
			<th>Comment</th>
			<th>Created</th>
			<th>Updated</th>
			<th>Edit</th>
			<th>Delete</th>
		</tr>
	</thead>
	<tbody>
		{#each data.results as result, index}
			<tr>
				<td>{result.name}</td>
				<td>{result.displayName}</td>
				<td>{result.quantity}</td>
				<td>{result.unit}</td>
				<td>{result.comment}</td>
				<td>{result.created}</td>
				<td>{result.updated}</td>
				<td>
					<button on:click={() => (openItem = index)}>Edit</button>
				</td>
				<td>
					<form method="POST" action="?/remove" use:enhance>
						<input type="hidden" name="id" value={result.id} />
						<button type="submit">Delete</button>
					</form>
				</td>
			</tr>
		{/each}
	</tbody>
</table>

{#if form?.deleted === true}
	<p>Deleted item {form?.result[0].displayName ?? form?.result[0].name}</p>
{/if}

{#if openItem !== undefined}
	<h2>Edit Item</h2>
	<p>ID: {data.results[openItem]?.id}</p>
	<ShoppingItemForm
		commentValue={data.results[openItem]?.comment ?? ''}
		nameValue={data.results[openItem]?.name}
		quantityValue={data.results[openItem]?.quantity?.toString()}
		units={[...data.units]}
		unitValue={data.results[openItem]?.unit}
	/>
	<button on:click={() => (openItem = undefined)}>Close</button>
{:else}
	<h2>Add Item</h2>
	<ShoppingItemForm
		commentValue={form?.values?.comment}
		nameValue={form?.values?.name}
		quantityValue={form?.values?.quantity?.toString()}
		units={[...data.units]}
		unitValue={form?.values?.unit}
	/>
{/if}

{#if form}
	<pre>{JSON.stringify(form, null, 2)}</pre>
{/if}

<style>
	tr {
		height: 2rem;
	}

	button:not(table button) {
		margin-top: 1rem;
	}
</style>
