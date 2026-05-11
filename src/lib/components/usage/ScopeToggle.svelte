<script lang="ts">
	import { Select } from '$lib/components/ui/select/index.js';
	import { USAGE_SCOPES, isUsageScope, type UsageScope } from '$lib/modules/usage/usage_types.js';

	interface Props {
		value: UsageScope;
		onchange: (scope: UsageScope) => void;
	}

	let { value, onchange }: Props = $props();

	const scopeOptions: { value: UsageScope; label: string }[] = [
		{ value: USAGE_SCOPES.workspace, label: 'This workspace' },
		{ value: USAGE_SCOPES.global, label: 'All workspaces' },
	];

	function handleChange(event: Event) {
		const selected = (event.currentTarget as HTMLSelectElement).value;
		if (isUsageScope(selected)) {
			onchange(selected);
		}
	}
</script>

<Select {value} onchange={handleChange} class="h-8 w-auto min-w-35 text-sm">
	{#each scopeOptions as option (option.value)}
		<option value={option.value}>{option.label}</option>
	{/each}
</Select>
