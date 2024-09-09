<script lang="ts">
	import InputWrapper from './InputWrapper.svelte';

	export let value: string;
	export let name: string = '';
	export let label: string;
	export let error: string | undefined = undefined;
	export let placeholder: string;
	export let required: boolean = false;
</script>

<InputWrapper {name} {label} {error}>
	<input type="text" id={name} {name} {required} min="1" {placeholder} {value} autocomplete="on" />
</InputWrapper>
