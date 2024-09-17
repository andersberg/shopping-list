<script lang="ts">
	import { page } from '$app/stores';
	import ShoppingItemForm from '$lib/components/ShoppingItemForm.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	export let form: FormData;

	console.log(form);
	console.log($page);
	console.log(data);
</script>

<h1>{data.list?.name}</h1>
<span>List ID: {data.list?.id}</span>

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
			<th>List Id</th>
			<th>Edit</th>
			<th>Delete</th>
		</tr>
	</thead>
	<tbody>
		{#each data.items as item}
			<tr>
				<td>{item.name}</td>
				<td>{item.displayName}</td>
				<td>{item.quantity}</td>
				<td>{item.unit}</td>
				<td>{item.comment}</td>
				<td>{item.created}</td>
				<td>{item.updated}</td>
				<td>{item.listId}</td>
				<td>
					<button>Edit</button>
				</td>
				<td>
					<button>Delete</button>
				</td>
			</tr>
		{/each}
	</tbody>
</table>

<ShoppingItemForm units={[...data.units]} actionName="add">
	<input type="hidden" name="listId" value={data.list?.id} />
</ShoppingItemForm>
