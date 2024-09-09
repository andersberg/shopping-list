<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<h1>Shopping Lists</h1>

<ul>
	{#each data.lists as list}
		<li>
			<a href="/{list.id}">{list.name}</a>
		</li>
	{/each}
</ul>

<form method="POST" use:enhance>
	<input type="text" name="name" placeholder="List name" />
	<button type="submit">Create List</button>
</form>
