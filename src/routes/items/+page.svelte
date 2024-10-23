<script lang="ts">
	import { enhance } from '$app/forms';
	import { insertItemSchema, selectItemSchema } from '$lib/db/schema/items';
	import { superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import type { PageData } from './$types';

	export let data: PageData;

	const { form: addItemForm, enhance: addItemFormEnhance } = superForm(data.addItemForm, {
		validators: zod(insertItemSchema)
	});

	const {
		form: editItemForm,
		enhance: editItemFormEnhance,
		tainted: editItemFormTainted
	} = superForm(data.editItemForm, {
		validators: zod(selectItemSchema)
	});
</script>

<h1>Shopping Items</h1>

<table>
	<thead>
		<tr>
			<th>Name</th>
			<th>Quantity</th>
			<th>Unit</th>
			<th>Comment</th>
			<th>Created</th>
			<th>Updated</th>
			<th>Update</th>
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
					<button
						on:click={() => {
							editItemForm.set(item);
						}}>Update</button
					>
				</td>
				<td>
					<form method="POST" action="?/deleteItem" use:editItemFormEnhance>
						{#each Object.entries(item) as [key, value]}
							<input type="hidden" name={key} {value} />
						{/each}

						<button type="submit">Delete</button>
					</form>
				</td>
			</tr>
		{/each}
	</tbody>
</table>

{#if $editItemFormTainted}
	<h2>Update Item</h2>
	<form method="POST" action="?/updateItem" use:editItemFormEnhance>
		<input type="hidden" name="id" placeholder="ID" bind:value={$editItemForm.id} />

		<label>
			<p>Name</p>
			<input type="text" name="name" placeholder="Item name" bind:value={$editItemForm.name} />
		</label>

		<label>
			<p>Comment</p>
			<input type="text" name="comment" placeholder="Comment" bind:value={$editItemForm.comment} />
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
				{#each data.units as unit}
					<option value={unit}>{unit}</option>
				{/each}
			</select>
		</label>

		<br />
		<button type="submit">Update Item</button>
	</form>
{:else}
	<h2>Add Item</h2>
	<form method="POST" action="?/addItem" use:addItemFormEnhance>
		<label>
			<p>Name</p>
			<input type="text" name="name" placeholder="Item name" bind:value={$addItemForm.name} />
		</label>

		<label>
			<p>Comment</p>
			<input type="text" name="comment" placeholder="Comment" bind:value={$addItemForm.comment} />
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
					<option value={unit} selected={unit === 'st'}>{unit}</option>
				{/each}
			</select>
		</label>

		<br />
		<button type="submit">Add Item</button>
	</form>
{/if}

<style>
	tr {
		height: 2rem;
	}

	button:not(table button) {
		margin-top: 1rem;
	}
</style>
