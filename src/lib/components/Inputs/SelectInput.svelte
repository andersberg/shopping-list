<script lang="ts">
	import InputWrapper from './InputWrapper.svelte';

	export let value: string;
	export let name: string = '';
	export let label: string;
	export let error: string | undefined = undefined;
	export let options: Array<string>;
</script>

<InputWrapper {name} {label} {error}>
	<select id={name} {name}>
		{#each options as option}
			<option value={option} selected={value === option}>{option}</option>
		{/each}
	</select>
</InputWrapper>
