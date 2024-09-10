<script lang="ts">
	import { page } from '$app/stores';
	import ShoppingItemForm from '$lib/components/ShoppingItemForm.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	// console.log($page);
	// console.log(data);
</script>

<h1>{data.list?.name}</h1>

<ShoppingItemForm units={[...data.units]}>
	<input type="hidden" name="listId" value={data.list?.id} />
</ShoppingItemForm>
