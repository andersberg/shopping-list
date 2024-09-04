<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

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
				<td>{result.value}</td>
				<td>{result.displayName}</td>
				<td>{result.quantity}</td>
				<td>{result.unit}</td>
				<td>{result.comment}</td>
				<td>{result.created}</td>
				<td>{result.updated}</td>
			</tr>
		{/each}
	</tbody>
</table>

<form method="POST" action="?/add-item">
	<h2>Add Item</h2>
	<input type="text" name="value" required minlength="3" placeholder="Item name" />
	<input type="number" name="quantity" required min="1" value="1" />
	<select name="unit">
		{#each data.units as unit}
			<option value={unit} selected={unit === 'st'}>{unit}</option>
		{/each}
	</select>
	<button type="submit">Add Item</button>
</form>

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

	form > input[name='value'] {
		grid-column: 1 / -1;
	}

	form > button {
		grid-column: 1 / -1;
	}
</style>
