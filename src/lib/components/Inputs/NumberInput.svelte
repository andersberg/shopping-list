<script lang="ts">
	import InputWrapper from './InputWrapper.svelte';

	export let value: string | number;
	export let name: string = '';
	export let label: string;
	export let error: string | undefined = undefined;
</script>

<InputWrapper {name} {label} {error}>
	<input type="number" id={name} {name} required minlength="3" {value} />
</InputWrapper>
