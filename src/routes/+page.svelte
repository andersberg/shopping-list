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

<h2>Add List</h2>
<form method="POST" action="?/add" use:addFormEnhance>
	<input type="text" name="name" placeholder="List name" bind:value={$addForm.name} />
	{#if $addFormErrors.name}
		<small class="text-red-500">{$addFormErrors.name}</small>
	{/if}
	<button type="submit">Create List</button>
</form>

{#if $addFormTainted}
	<SuperDebug data={$addForm} label={'Add list Form'} />
{/if}
