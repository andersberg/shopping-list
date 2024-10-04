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

	// const {
	// 	enhance: editFormEnhance,
	// 	form: editForm,
	// 	reset: editFormReset,
	// 	tainted: editFormTainted
	// } = superForm(data.editForm, {
	// 	validators: zod(insertListSchema)
	// });

	// let activeForm = $editFormTainted ? editForm : addForm;
</script>

<h1>Shopping Lists</h1>

<ul>
	{#each data.lists as list}
		<li>
			<a href="/{list.id}">{list.name}</a>
			<!-- <button on:click={() => editForm.set(list)}>Edit</button> -->
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

<!-- {#if $editFormTainted}
	<h2>Edit List</h2>
	<form method="POST" action="?/edit" use:editFormEnhance>
		<input type="text" name="name" placeholder="List name" bind:value={$editForm.name} />
		<input type="hidden" name="id" bind:value={$editForm.id} />

		<button type="submit">Update List</button>
	</form>
	<button on:click={() => editFormReset()}>Reset</button>
{:else}
	<h2>Add List</h2>
	<form method="POST" action="?/add" use:addFormEnhance>
		<input type="text" name="name" placeholder="List name" bind:value={$addForm.name} />
		{#if $addFormErrors.name}
			<small class="text-red-500">{$addFormErrors.name}</small>
		{/if}
		<button type="submit">Create List</button>
	</form>
{/if} -->

<!-- <SuperDebug
	data={activeForm === editForm ? $editForm : $addForm}
	label={activeForm === editForm ? 'Edit list Form' : 'Add list Form'}
/> -->
