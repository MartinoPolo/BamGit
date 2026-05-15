<script lang="ts">
	import { onMount } from 'svelte';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import * as DropdownMenu from '$lib/components/shadcn/dropdown-menu/index.js';
	import { Separator } from '$lib/components/shadcn/separator/index.js';
	import { getAppSetting, setAppSetting } from '$lib/modules/window/window_commands.js';
	import type { SplitButtonProps } from './split_button_types.js';

	let {
		options,
		defaultValue,
		settingsKey,
		size = 'sm',
		disabled = false,
		onselect,
	}: SplitButtonProps = $props();

	let selectedValue = $state(defaultValue);

	let selectedLabel = $derived(
		options.find((option) => option.value === selectedValue)?.label ?? selectedValue,
	);

	function handleMainClick() {
		onselect(selectedValue);
	}

	function handleOptionSelect(value: string) {
		selectedValue = value;
		onselect(value);
		if (settingsKey !== undefined && settingsKey !== '') {
			void setAppSetting(settingsKey, value);
		}
	}

	onMount(() => {
		if (settingsKey !== undefined && settingsKey !== '') {
			void getAppSetting(settingsKey).then((setting) => {
				if (setting !== null && setting.value !== '') {
					const matchesOption = options.some((option) => option.value === setting.value);
					if (matchesOption) {
						selectedValue = setting.value;
					}
				}
			});
		}
	});
</script>

<div class="inline-flex items-stretch" role="group">
	<Button
		intent="secondary"
		{size}
		{disabled}
		class="rounded-r-none border-r-0"
		onclick={handleMainClick}
	>
		{selectedLabel}
	</Button>
	<Separator orientation="vertical" />
	<DropdownMenu.Root>
		<DropdownMenu.Trigger {disabled}>
			{#snippet child({ props })}
				<Button
					intent="secondary"
					size={size === 'sm' ? 'icon-sm' : 'icon'}
					class="rounded-l-none border-l-0"
					{...props}
				>
					<ChevronDownIcon data-icon="inline-start" />
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end">
			{#each options as option (option.value)}
				<DropdownMenu.Item
					onclick={() => handleOptionSelect(option.value)}
					data-active={option.value === selectedValue ? '' : undefined}
				>
					{option.label}
				</DropdownMenu.Item>
			{/each}
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</div>
