<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	const tableHeaders = Object.keys(data.results[0]);
</script>

<h1>{data.message}</h1>

<table>
	<thead>
		<tr>
			{#each tableHeaders as header}
				<th align="left">{header}</th>
			{/each}
		</tr>
	</thead>
	<tbody>
		{#each data.results as result}
			<tr>
				<td>{result.id}</td>
				<td>{result.name}</td>
				<td>{result.displayName}</td>
				<td>{result.quantity}</td>
				<td>{result.unit}</td>
				<td>{result.comment}</td>
				<td>{result.created}</td>
				<td>{result.updated}</td>
				<td>
					<form method="POST" action="?/delete" use:enhance>
						<input type="hidden" name="id" value={result.id} />
						<button type="submit">Delete</button>
					</form>
				</td></tr
			>
		{/each}
	</tbody>
</table>

{#if form?.deleted === true}
	<p>Deleted item {form?.result[0].displayName ?? form?.result[0].name}</p>
{/if}

<form method="POST" action="?/add" use:enhance>
	<h2>Add Item</h2>

	<label for="name">Name</label>
	<input
		type="text"
		name="name"
		required
		minlength="3"
		placeholder="Item name"
		value={form?.values?.name ?? ''}
	/>
	{#if form?.errors?.name}
		<span class="text-red-500">{form.errors.name}</span>
	{/if}

	<label for="comment">Comment</label>
	<input type="text" name="comment" placeholder="Comment" value={form?.values?.comment ?? ''} />

	<label for="quantity">Quantity</label>
	<input type="number" name="quantity" required min="1" value={form?.values?.quantity ?? '1'} />
	{#if form?.errors?.quantity}
		<span class="text-red-500">{form.errors.quantity}</span>
	{/if}

	<label for="unit">Unit</label>
	<select name="unit">
		{#each data.units as unit}
			<option value={unit} selected={form?.values?.unit === unit}>{unit}</option>
		{/each}
	</select>
	{#if form?.errors?.unit}
		<span class="text-red-500">{form.errors.unit}</span>
	{/if}

	<button type="submit">Add Item</button>
</form>

<pre>{JSON.stringify(form, null, 2)}</pre>

<style>
	form {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.5rem;
		max-width: fit-content;
	}

	form > h2 {
		grid-column: 1 / -1;
	}

	form > input[name='name'],
	form > input[name='comment'],
	form > span {
		grid-column: 1 / -1;
	}

	form > button {
		grid-column: 1 / -1;
	}
</style>
