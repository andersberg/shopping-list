<script lang="ts">
	import { enhance } from '$app/forms';
	import { insertListSchema } from '$lib/db/schema/lists';
	import SuperDebug, { superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import type { PageData } from './$types';

	export let data: PageData;

	const {
		form: addForm,
		errors: addFormErrors,
		enhance: addFormEnhance,
		tainted: addFormTainted
	} = superForm(data.form, { validators: zod(insertListSchema) });
</script>

<h1>Shopping Lists</h1>

<div class="container">
	<ul>
		{#each data.lists as list}
			<li>
				<a href="/{list.id}">{list.name}</a>
				<form method="POST" action="?/delete" use:enhance>
					<input type="hidden" name="id" value={list.id} />
					<button type="submit">Delete</button>
				</form>
			</li>
		{/each}
	</ul>

	<form method="POST" action="?/add" use:addFormEnhance>
		<input type="text" name="name" placeholder="Skapa ny lista" bind:value={$addForm.name} />
		<button type="submit">Skapa</button>

		{#if $addFormErrors.name}
			<small class="text-red-500">{$addFormErrors.name}</small>
		{/if}
	</form>
</div>

<style>
	.container {
		display: grid;
		gap: 1rem;
		grid-template-columns: 1fr auto;
	}

	ul {
		padding: 0;
		margin: 0;
		grid-column: 1 / -1;
		grid-template-columns: subgrid;
		display: grid;
		gap: 1rem;
	}

	li {
		display: grid;
		grid-template-columns: subgrid;
		grid-column: 1 / -1;
		gap: 1rem;
	}

	form:not(ul form) {
		display: grid;
		grid-template-columns: subgrid;
		grid-column: 1 / -1;
		gap: 1rem;

		& > small {
			grid-column: 1;
		}
	}
</style>
