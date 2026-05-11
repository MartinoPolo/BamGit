<script lang="ts">
	import { Select } from '$lib/components/shadcn/select/index.js';
	import {
		GROUP_BY_OPTIONS,
		isGroupByOption,
		type GroupByOption,
	} from '$lib/modules/usage/usage_types.js';

	interface Props {
		value: GroupByOption;
		onchange: (option: GroupByOption) => void;
	}

	let { value, onchange }: Props = $props();

	const groupOptions: { value: GroupByOption; label: string }[] = [
		{ value: GROUP_BY_OPTIONS.none, label: 'None' },
		{ value: GROUP_BY_OPTIONS.model, label: 'Model' },
		{ value: GROUP_BY_OPTIONS.provider, label: 'Provider' },
		{ value: GROUP_BY_OPTIONS.category, label: 'Category' },
	];

	function handleChange(event: Event) {
		const selected = (event.currentTarget as HTMLSelectElement).value;
		if (isGroupByOption(selected)) {
			onchange(selected);
		}
	}
</script>

<Select {value} onchange={handleChange} class="h-8 w-auto min-w-30 text-sm">
	{#each groupOptions as option (option.value)}
		<option value={option.value}>{option.label}</option>
	{/each}
</Select>
