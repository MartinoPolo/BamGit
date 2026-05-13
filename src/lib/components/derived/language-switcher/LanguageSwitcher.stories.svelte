<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import LanguageSwitcher from './LanguageSwitcher.svelte';

	const { Story } = defineMeta({
		title: 'Derived/LanguageSwitcher',
		component: LanguageSwitcher,
		tags: ['autodocs'],
		argTypes: {
			collapsed: { control: 'boolean' },
		},
	});
</script>

<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import * as Tooltip from '$lib/components/shadcn/tooltip/index.js';

	type SwitcherProps = ComponentProps<typeof LanguageSwitcher>;
</script>

<Story name="Default" args={{ collapsed: false }}>
	{#snippet template(args: SwitcherProps)}
		<Tooltip.Provider>
			<div class="w-48 rounded-lg bg-sidebar p-2">
				<LanguageSwitcher {...args} />
			</div>
		</Tooltip.Provider>
	{/snippet}
</Story>

<Story name="Collapsed" args={{ collapsed: true }}>
	{#snippet template(args: SwitcherProps)}
		<Tooltip.Provider>
			<div class="flex w-14 justify-center rounded-lg bg-sidebar px-2 py-1">
				<LanguageSwitcher {...args} />
			</div>
		</Tooltip.Provider>
	{/snippet}
</Story>

<Story name="All States">
	<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -- Storybook requires template arg -->
	{#snippet template(_args: SwitcherProps)}
		<Tooltip.Provider>
			<div class="flex items-start gap-8">
				<div class="flex flex-col gap-2">
					<p class="text-xs text-muted-foreground">Expanded</p>
					<div class="w-48 rounded-lg bg-sidebar p-2">
						<LanguageSwitcher />
					</div>
				</div>
				<div class="flex flex-col gap-2">
					<p class="text-xs text-muted-foreground">Collapsed</p>
					<div class="flex w-14 justify-center rounded-lg bg-sidebar px-2 py-1">
						<LanguageSwitcher collapsed />
					</div>
				</div>
			</div>
		</Tooltip.Provider>
	{/snippet}
</Story>
