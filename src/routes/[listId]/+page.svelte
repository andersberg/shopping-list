<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { addListItemSchema, selectListItemSchema } from '$lib/db/schema/listItems';
	import { zod } from 'sveltekit-superforms/adapters';
	import { superForm } from 'sveltekit-superforms/client';
	import type { PageData } from './$types';
	import EditListItem from './EditListItem.svelte';
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

	async function toggleChecked(event: Event) {
		event.preventDefault();

		if (event.currentTarget instanceof HTMLFormElement) {
			const form = event.currentTarget;
			const data = new FormData(form);

			await fetch(form.action, {
				method: 'POST',
				body: new FormData(form)
			});

			// Invalidate the current page data
			await invalidate('app:list');
		}
	}
	// $: console.log('data', data);
	// $: console.log('data.forms.addListItem', data.forms.addListItem);
	// $: console.log('$addItemForm', $addItemForm);
	// $: console.log('$editListItemForm,', $editListItemForm);

	let openItem: number | undefined = undefined;
	function toggleOpenItem(index?: number) {
		openItem = index;
	}
</script>

<ListHeader form={data.forms.editList} title={data.list.name} />

<ul class="list">
	{#each data.items as item, index}
		<li class="list-item" class:checked={item.checked}>
			<form on:change={toggleChecked} action="?/updateItem" method="POST">
				<input type="hidden" name="id" value={item.id} />
				<input type="hidden" name="listId" value={item.listId} />
				<input type="hidden" name="checked" value="false" />
				<input type="checkbox" name="checked" bind:checked={item.checked} value={item.checked} />
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
					toggleOpenItem(index);
				}}>Edit</button
			>
		</li>
	{/each}
</ul>

{#if openItem !== undefined}
	<EditListItem
		item={data.items[openItem]}
		units={data.units}
		handleDelete={() => {
			invalidate('app:list');
			toggleOpenItem();
		}}
		handleClose={() => {
			toggleOpenItem();
		}}
		handleSubmit={() => {
			toggleOpenItem();
		}}
	/>

	<!-- <SuperDebug data={$editListItemForm} label={'Edit List Item Form'} /> -->
{:else}
	<h2>Add item</h2>
	<form method="POST" action="?/addItem" use:addItemFormEnhance>
		<input type="hidden" name="listId" value={data.list.id} />
		<input type="text" name="value" placeholder="List Item value" bind:value={$addItemForm.value} />

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

	.list-item.checked *:not(button) {
		opacity: 0.5;
	}

	.list-item.checked:hover * {
		opacity: 1;
	}

	/* .list-item + .list-item {
		border-top: 1px solid black;
	} */
</style>
