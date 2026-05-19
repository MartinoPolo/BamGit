<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, userEvent, within } from 'storybook/test';
	import ThemeToggle from './ThemeToggle.svelte';

	const { Story } = defineMeta({
		title: 'Derived/ThemeToggle',
		component: ThemeToggle,
		tags: ['autodocs'],
		argTypes: {
			collapsed: { control: 'boolean' },
		},
	});

	const playTabsVisible = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);
		const tabs = canvas.getAllByRole('tab');
		await expect(tabs.length).toBe(3);
		for (const tab of tabs) {
			await expect(tab).toBeVisible();
		}
	};

	const playClickCyclesTabs = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);
		const tabs = canvas.getAllByRole('tab');

		// Find the currently active tab index
		const initialActiveIndex = tabs.findIndex(
			(t) => t.getAttribute('aria-selected') === 'true',
		);
		await expect(initialActiveIndex).toBeGreaterThanOrEqual(0);

		// Click the next tab (wrapping around)
		const nextIndex = (initialActiveIndex + 1) % tabs.length;
		await userEvent.click(tabs[nextIndex]);

		await expect(tabs[nextIndex]).toHaveAttribute('aria-selected', 'true');
		await expect(tabs[initialActiveIndex]).toHaveAttribute('aria-selected', 'false');
	};

	const playCollapsedButtonVisible = async ({
		canvasElement,
	}: {
		canvasElement: HTMLElement;
	}) => {
		const canvas = within(canvasElement);
		const button = canvas.getByRole('button', { name: /mode/i });
		await expect(button).toBeVisible();
		await expect(button).toHaveAttribute('aria-label');
	};

	const playCollapsedClickCycles = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);
		const button = canvas.getByRole('button', { name: /mode/i });
		const initialLabel = button.getAttribute('aria-label');
		await userEvent.click(button);
		const updatedLabel = button.getAttribute('aria-label');
		await expect(updatedLabel).not.toBe(initialLabel);
	};
</script>

<script lang="ts">
	import type { ComponentProps } from 'svelte';

	type ToggleProps = ComponentProps<typeof ThemeToggle>;
</script>

<Story name="Default" args={{ collapsed: false }}>
	{#snippet template(args: ToggleProps)}
		<div class="w-56 rounded-lg bg-sidebar p-2">
			<ThemeToggle {...args} />
		</div>
	{/snippet}
</Story>

<Story name="Collapsed" args={{ collapsed: true }}>
	{#snippet template(args: ToggleProps)}
		<div class="flex w-14 justify-center rounded-lg bg-sidebar px-2">
			<ThemeToggle {...args} />
		</div>
	{/snippet}
</Story>

<Story
	name="Tabs Are Visible [play: tabs visible]"
	args={{ collapsed: false }}
	play={playTabsVisible}
>
	{#snippet template(args: ToggleProps)}
		<div class="w-56 rounded-lg bg-sidebar p-2">
			<ThemeToggle {...args} />
		</div>
	{/snippet}
</Story>

<Story
	name="Click Cycles Theme [play: click cycles theme]"
	args={{ collapsed: false }}
	play={playClickCyclesTabs}
>
	{#snippet template(args: ToggleProps)}
		<div class="w-56 rounded-lg bg-sidebar p-2">
			<ThemeToggle {...args} />
		</div>
	{/snippet}
</Story>

<Story
	name="Collapsed Button Visible [play: collapsed button visible]"
	args={{ collapsed: true }}
	play={playCollapsedButtonVisible}
>
	{#snippet template(args: ToggleProps)}
		<div class="flex w-14 justify-center rounded-lg bg-sidebar px-2">
			<ThemeToggle {...args} />
		</div>
	{/snippet}
</Story>

<Story
	name="Collapsed Click Cycles Theme [play: collapsed click cycles]"
	args={{ collapsed: true }}
	play={playCollapsedClickCycles}
>
	{#snippet template(args: ToggleProps)}
		<div class="flex w-14 justify-center rounded-lg bg-sidebar px-2">
			<ThemeToggle {...args} />
		</div>
	{/snippet}
</Story>
