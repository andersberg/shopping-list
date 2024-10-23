<script lang="ts">
	import { enhance } from '$app/forms';
	import { addListItemSchema, selectListItemSchema } from '$lib/db/schema/listItems';
	import { formatUTCToTimezone as formatUTCToBrowserTimezone } from '$lib/formatUTCToTimezone';
	import SuperDebug from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { superForm } from 'sveltekit-superforms/client';
	import type { PageData } from './$types';
	import ListHeader from './ListHeader.svelte';

	export let data: PageData;

	const {
		enhance: addItemFormEnhance,
		form: addItemForm,
		message: addItemMessage,
		errors: addItemErrors,
		tainted: addItemFormTainted,
		constraints: addItemFormConstraints
	} = superForm(data.forms.addListItem, {
		validators: zod(addListItemSchema)
	});

	const {
		enhance: editListItemFormEnhance,
		form: editListItemForm,
		tainted: editListItemFormTainted,
		reset: resetEditListItemForm
	} = superForm(data.forms.editListItem, {
		validators: zod(selectListItemSchema)
	});

	// $: console.log('data', data);
	// $: console.log('data.forms.addListItem', data.forms.addListItem);
	// $: console.log('$addItemForm', $addItemForm);
	// $: console.log('$editListItemForm,', $editListItemForm);
</script>

<ListHeader form={data.forms.editList} title={data.list.name} />

<ul class="list">
	{#each data.items as item}
		<li class="list-item">
			<form>
				<input type="checkbox" name="id" value={item.id} />
			</form>
			<span>
				{item.name}
			</span>
			<span>
				{item.quantity}

				{item.unit}
			</span>
			<span>
				{item.comment}
			</span>

			<button
				on:click={() => {
					editListItemForm.set(item);
				}}>Edit</button
			>

			<form method="POST" action="?/deleteItem" use:enhance>
				<input type="hidden" name="id" value={item.id} />
				<button type="submit">Delete</button>
			</form>
		</li>
	{/each}
</ul>

{#if $editListItemFormTainted}
	<h2>Edit Item</h2>
	<form method="POST" action="?/updateItem" use:editListItemFormEnhance>
		<input type="hidden" name="id" bind:value={$editListItemForm.id} />
		<input type="hidden" name="listId" bind:value={$editListItemForm.listId} />

		<label>
			<p>Name</p>
			<input type="text" name="name" placeholder="Item name" bind:value={$editListItemForm.name} />
		</label>

		<label>
			<p>Quantity</p>
			<input
				type="number"
				name="quantity"
				placeholder="Quantity"
				bind:value={$editListItemForm.quantity}
			/>
		</label>

		<label>
			<p>Unit</p>
			<select name="unit" bind:value={$editListItemForm.unit}>
				{#each data.units as unit}
					<option value={unit}>{unit}</option>
				{/each}
			</select>
		</label>

		<label>
			<p>Comment</p>
			<input
				type="text"
				name="comment"
				placeholder="Comment"
				bind:value={$editListItemForm.comment}
			/>
		</label>

		<p>Created: {formatUTCToBrowserTimezone($editListItemForm.created)}</p>
		<p>Updated: {formatUTCToBrowserTimezone($editListItemForm.updated)}</p>

		<button type="submit">Save</button>
	</form>

	<button on:click={() => resetEditListItemForm()}>Close</button>

	<!-- <SuperDebug data={$editListItemForm} label={'Edit List Item Form'} /> -->
{:else}
	<h2>Add item</h2>
	<form method="POST" action="?/addItem" use:addItemFormEnhance>
		<input type="hidden" name="listId" value={data.list.id} />
		<input
			type="text"
			name="value"
			placeholder="List Item value"
			bind:value={$addItemForm.value}
			{...$addItemFormConstraints.value}
		/>

		{#if $addItemErrors.value && $addItemFormTainted?.value}
			<small class="text-red-500">{$addItemErrors.value}</small>
		{/if}

		<button type="submit">Add List Item</button>
	</form>
	<br />
	{#if $addItemMessage}
		<p>{$addItemMessage}</p>
	{/if}
	<!-- <SuperDebug data={addItemForm} label={'Add Item Form'} /> -->
{/if}

<style>
	.list {
		max-width: fit-content;
		display: grid;
		grid-template-columns: auto auto auto 1fr auto auto;
		column-gap: 1rem;
		row-gap: 0.5rem;
		padding-left: 0;
	}

	.list-item {
		display: grid;
		grid-column: 1 / -1;
		grid-template-columns: subgrid;
	}

	/* .list-item + .list-item {
		border-top: 1px solid black;
	} */
</style>
