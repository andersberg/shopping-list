<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import ShoppingItemForm from '$lib/components/ShoppingItemForm.svelte';
	import { selectListSchema } from '$lib/db/schema/lists';
	import SuperDebug from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { superForm } from 'sveltekit-superforms/client';
	import type { PageData } from './$types';

	export let data: PageData;

	const LIST_FORM_ID = 'list-form';

	const { enhance: editListFormEnhance, form: editListForm } = superForm(data.editListForm, {
		validators: zod(selectListSchema),
		// resetForm: true,
		// applyAction: true,
		invalidateAll: 'force',
		id: LIST_FORM_ID
	});

	const { enhance: addItemFormEnhance, form: addItemForm } = superForm(data.addItemForm, {
		validators: zod(selectListSchema)
		// resetForm: true,
		// applyAction: true,
		// invalidateAll: 'force',
		// id: LIST_FORM_ID
	});

	$: console.log('data.editListForm', data.editListForm);

	let openItem: number;
</script>

<h1>{data.editListForm.data.name}</h1>
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

<h2>Add item</h2>
<form method="POST" action="?/addItem" use:addItemFormEnhance>
	<label>
		<p>Name</p>
		<input type="text" name="name" placeholder="Item name" bind:value={$addItemForm.name} />
	</label>

	<label>
		<p>Quantity</p>
		<input
			type="number"
			name="quantity"
			placeholder="Quantity"
			bind:value={$addItemForm.quantity}
		/>
	</label>

	<label>
		<p>Unit</p>
		<select name="unit" bind:value={$addItemForm.unit}>
			{#each data.units as unit}
				<option value={unit}>{unit}</option>
			{/each}
		</select>
	</label>

	<label>
		<p>Comment</p>
		<input type="text" name="comment" placeholder="Comment" bind:value={$addItemForm.comment} />
	</label>

	<input type="hidden" name="listId" id="listId" bind:value={data.editListForm.data.id} />
	<br />
	<br />
	<button type="submit">Add Item</button>
</form>

<!-- {#if openItem}
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
		<input type="hidden" name="listId" id="listId" bind:value={data.editListForm.data.id} />
	</ShoppingItemForm>
{/if} -->

<h2>Edit List</h2>
<form method="POST" action="?/editList" use:editListFormEnhance>
	<input type="text" name="name" placeholder="List name" bind:value={$editListForm.name} />
	<input type="hidden" name="id" bind:value={$editListForm.id} />

	<button type="submit">Update List</button>
</form>
<br />
<SuperDebug data={editListForm} label={'Edit list Form'} />
