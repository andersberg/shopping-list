<script lang="ts">
	import { onMount } from 'svelte';

	// Props
	interface Props {
		items?: string[];
		onSubmit: (value: string) => void;
	}

	let { items = [], onSubmit }: Props = $props();

	let inputValue = $state('');
	let suggestions = $state<string[]>([]);
	let showSuggestions = $state(false);
	let inputElement = $state<HTMLInputElement>();
	let suggestionsElement = $state<HTMLDivElement>();

	// Debounce function implementation
	function debounce<T extends (...args: any[]) => any>(
		func: T,
		wait: number
	): (...args: Parameters<T>) => void {
		let timeout: ReturnType<typeof setTimeout>;

		return function executedFunction(...args: Parameters<T>) {
			const later = () => {
				clearTimeout(timeout);
				func(...args);
			};
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
		};
	}

	const searchItems = debounce((searchTerm: string) => {
		suggestions = items
			.filter((item) => item.toLowerCase().includes(searchTerm.toLowerCase()))
			.slice(0, 5); // Limit to 5 suggestions
	}, 300);

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		inputValue = target.value;
		showSuggestions = true;
		searchItems(inputValue);
	}

	function handleSubmit(value: string = inputValue) {
		if (value.trim()) {
			onSubmit(value);
			inputValue = '';
			suggestions = [];
			showSuggestions = false;
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleSubmit();
		}
	}

	// Handle clicks outside of the suggestions box
	onMount(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as Node;
			if (
				suggestionsElement &&
				!suggestionsElement.contains(target) &&
				!inputElement?.contains(target)
			) {
				showSuggestions = false;
			}
		};

		document.addEventListener('mousedown', handleClickOutside);

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	});
</script>

<div class="relative w-full max-w-md">
	<div class="relative">
		<input
			bind:this={inputElement}
			type="text"
			bind:value={inputValue}
			oninput={handleInput}
			onkeydown={handleKeyDown}
			onfocus={() => (showSuggestions = true)}
			placeholder="Type to search..."
			class="w-full px-4 py-2 border rounded-md pr-10"
		/>
	</div>

	<button
		onclick={() => handleSubmit()}
		class="mt-2 w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
	>
		Add Item
	</button>

	{#if showSuggestions && suggestions.length > 0}
		<div
			bind:this={suggestionsElement}
			class="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg"
		>
			{#each suggestions as suggestion}
				<button
					class="px-4 py-2 cursor-pointer hover:bg-gray-100"
					onclick={() => handleSubmit(suggestion)}
				>
					{suggestion}
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	/* Add any additional styles here */
</style>
