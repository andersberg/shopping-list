<script lang="ts">
	import type { FormOptions, Infer, SuperValidated } from 'sveltekit-superforms';
	import SuperDebug from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { superForm } from 'sveltekit-superforms/client';
	import type { AnyZodObject } from 'zod';

	export let data: SuperValidated<Infer<AnyZodObject>>;
	export let formOptions: FormOptions | undefined = undefined;
	export let schema: AnyZodObject;
	export let action: HTMLFormElement['action'];
	export let method: HTMLFormElement['method'] = 'POST';

	const { enhance, form } = superForm(data, {
		validators: zod(schema),
		...formOptions
	});

	const formProps: Pick<HTMLFormElement, 'action' | 'method'> = {
		action,
		method
	};
</script>

{#if method === 'POST'}
	<form {...formProps} use:enhance>
		<slot {form} />
	</form>
{:else}
	<form {...formProps}>
		<slot {form} />
	</form>
{/if}

<SuperDebug data={$form} />
