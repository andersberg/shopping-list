<script lang="ts">
	import { enhance } from '$app/forms';
	import NumberInput from './Inputs/NumberInput.svelte';
	import SelectInput from './Inputs/SelectInput.svelte';
	import TextInput from './Inputs/TextInput.svelte';

	export let commentValue: string = '';
	export let nameValue: string = '';
	export let quantityValue: string = '1';
	export let units: string[];
	export let unitValue: string = 'st';
	export let actionName: string | undefined = undefined;
</script>

<form method="POST" action={actionName ? `?/${actionName}` : undefined} use:enhance>
	<TextInput name="name" label="Name" value={nameValue} placeholder="Item name" required />

	<TextInput name="comment" label="Comment" placeholder="Comment" value={commentValue} />

	<NumberInput name="quantity" label="Quantity" value={quantityValue} />

	<SelectInput name="unit" label="Unit" value={unitValue} options={units} />

	<slot />

	<button type="submit">Add Item</button>
</form>

<style>
	form {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.5rem;
		max-width: fit-content;
	}

	form > button {
		grid-column: 1 / -1;
	}
</style>
