<script lang="ts">
	import { Select } from '$lib/components/shadcn/select/index.js';
	import { LANGUAGE_OPTIONS } from '$lib/modules/character-packs';

	interface Props {
		value?: string | null;
		onchange?: (value: string) => void;
	}

	let { value = null, onchange }: Props = $props();
</script>

<Select
	value={value ?? ''}
	class="h-8 w-35 text-xs"
	onchange={(event) => {
		const target = event.currentTarget;
		if (target.value.length > 0) {
			onchange?.(target.value);
		}
	}}
>
	<option value="" disabled>Language...</option>
	{#each LANGUAGE_OPTIONS as option (option.value)}
		<option value={option.value}>{option.flag} {option.label}</option>
	{/each}
</Select>
