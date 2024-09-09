<script lang="ts">
	export let name: string;
	export let label: string;
	export let error: string | undefined = undefined;
</script>

<div>
	<label for={name}>{label}</label>
	<slot />
	{#if error}
		<span class="text-red-500">{error}</span>
	{/if}
</div>

<style>
	div * {
		display: block;
		width: 100%;
	}

	div > label {
		margin-bottom: 0.5rem;
	}
</style>
