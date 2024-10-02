<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import ShoppingItemForm from '$lib/components/ShoppingItemForm.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	// export let form: FormData;

	// console.log(form);
	// console.log($page);
	// console.log(data);

	let openItem: number | undefined;
</script>

<h1>{data.list?.name}</h1>
<p>List ID: {$page.params.listId}</p>

<table>
	<thead>
		<tr>
			<th>Name</th>
			<th>Quantity</th>
			<th>Unit</th>
			<th>Comment</th>
			<th>Created</th>
			<th>Updated</th>
			<th>List Id</th>
			<th>Edit</th>
			<th>Delete</th>
		</tr>
	</thead>
	<tbody>
		{#each data.items as item, index}
			<tr>
				<td>{item.name}</td>
				<td>{item.quantity}</td>
				<td>{item.unit}</td>
				<td>{item.comment}</td>
				<td>{item.created}</td>
				<td>{item.updated}</td>
				<td>{item.listId}</td>
				<td>
					<button on:click={() => (openItem = index)}>Edit</button>
				</td>
				<td>
					<form method="POST" action="?/delete" use:enhance>
						<input type="hidden" name="id" value={item.id} />
						<button type="submit">Delete</button>
					</form>
				</td>
			</tr>
		{/each}
	</tbody>
</table>

{#if openItem}
	<ShoppingItemForm
		actionName="edit"
		buttonText="Edit Item"
		commentValue={data.items[openItem]?.comment ?? ''}
		nameValue={data.items[openItem]?.name}
		quantityValue={data.items[openItem]?.quantity?.toString()}
		units={[...data.units]}
		unitValue={data.items[openItem]?.unit}
	>
		<input type="hidden" name="id" id="id" value={data.items[openItem]?.id} />
		<input type="hidden" name="listId" id="listId" value={$page.params.listId} />
	</ShoppingItemForm>
{:else}
	<ShoppingItemForm units={[...data.units]} actionName="add" buttonText="Add Item">
		<input type="hidden" name="listId" id="listId" value={$page.params.listId} />
	</ShoppingItemForm>
{/if}
