<script lang="ts">
	import type { List } from '$lib/db/schema/lists';
	import { selectListSchema } from '$lib/db/schema/lists';
	import type { SuperValidated } from 'sveltekit-superforms';
	import SuperDebug, { superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';

	export let form: SuperValidated<List>;
	export let title: string;

	const { enhance } = superForm(form, {
		validators: zod(selectListSchema)
	});

	let edit = false;
	function toggleEdit() {
		edit = !edit;
	}
</script>

<header>
	<h1 class="title">{title}</h1>
	<button class="toggle-button" on:click={toggleEdit}>{edit ? 'Close' : 'Edit'}</button>

	{#if edit}
		<p class="list-id">List ID: {form.data.id}</p>

		<form method="POST" action="?/editList" use:enhance>
			<input type="text" name="name" placeholder="List name" bind:value={form.data.name} />
			<input type="hidden" name="id" bind:value={form.data.id} />

			<button type="submit">Save</button>

			<SuperDebug data={form.data} label={'Edit list Form'} />
		</form>
	{/if}
</header>

<style>
	header {
		max-width: 25rem;
		display: grid;
		gap: 1rem;
		grid-template-columns: 1fr 4rem;
		margin: 1rem 0;
	}

	h1 {
		margin: 0;
	}

	.list-id {
		margin: 0;
		grid-column: 1 / -1;
	}

	.toggle-button {
		grid-column: 2;
		align-self: self-start;
	}

	form {
		display: grid;
		grid-template-columns: subgrid;
		grid-column: 1 / -1;
		gap: inherit;
	}

	header :global(.super-debug) {
		grid-column: 1 / -1;
	}
</style>
