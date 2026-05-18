<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, userEvent, within } from 'storybook/test';
	import { Switch } from './index.js';
	import { Label } from '$lib/components/shadcn/label/index.js';
	import StoryKeyboardHints from '$lib/storybook/StoryKeyboardHints.svelte';
	import KeyboardHint from '$lib/storybook/KeyboardHint.svelte';

	const { Story } = defineMeta({
		title: 'Base/Switch',
		component: Switch,
		tags: ['autodocs'],
		argTypes: {
			checked: { control: 'boolean' },
			disabled: { control: 'boolean' },
		},
	});

	const playClickTogglesOn = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);
		const switchEl = canvas.getByRole('switch');
		await expect(switchEl).toHaveAttribute('aria-checked', 'false');
		await userEvent.click(switchEl);
		await expect(switchEl).toHaveAttribute('aria-checked', 'true');
	};

	const playClickTogglesOff = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);
		const switchEl = canvas.getByRole('switch');
		await expect(switchEl).toHaveAttribute('aria-checked', 'true');
		await userEvent.click(switchEl);
		await expect(switchEl).toHaveAttribute('aria-checked', 'false');
	};

	const playDisabledIgnoresClick = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);
		const switchEl = canvas.getByRole('switch');
		await expect(switchEl).toHaveAttribute('aria-checked', 'false');
		await userEvent.click(switchEl);
		await expect(switchEl).toHaveAttribute('aria-checked', 'false');
	};

	const playSpaceKeyToggles = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);
		const switchEl = canvas.getByRole('switch');
		await expect(switchEl).toHaveAttribute('aria-checked', 'false');
		switchEl.focus();
		await userEvent.keyboard(' ');
		await expect(switchEl).toHaveAttribute('aria-checked', 'true');
		await userEvent.keyboard(' ');
		await expect(switchEl).toHaveAttribute('aria-checked', 'false');
	};
</script>

<script lang="ts">
	import type { SwitchProps } from './switch-variants.js';
</script>

<Story name="Off [play: click toggles on]" play={playClickTogglesOn}>
	{#snippet template(args: SwitchProps)}
		<Switch {...args} />
	{/snippet}
</Story>

<Story name="On [play: click toggles off]" play={playClickTogglesOff}>
	{#snippet template(args: SwitchProps)}
		<Switch {...args} checked />
	{/snippet}
</Story>

<Story name="Disabled Off [play: disabled ignores click]" play={playDisabledIgnoresClick}>
	{#snippet template(args: SwitchProps)}
		<Switch {...args} disabled />
	{/snippet}
</Story>

<Story name="Disabled On">
	{#snippet template(args: SwitchProps)}
		<Switch {...args} disabled checked />
	{/snippet}
</Story>

<Story name="Space Key Toggles [play: space key toggles]" play={playSpaceKeyToggles}>
	{#snippet template(args: SwitchProps)}
		<div class="w-80">
			<StoryKeyboardHints>
				<KeyboardHint keys="Space" action="Toggle on/off" />
			</StoryKeyboardHints>
			<Switch {...args} />
		</div>
	{/snippet}
</Story>

<Story name="With Label">
	{#snippet template(args: SwitchProps)}
		<div class="flex items-center gap-2.5">
			<Switch {...args} id="auto-fetch" checked />
			<Label for="auto-fetch" class="mb-0 cursor-pointer text-(length:--text-md)"
				>Auto-fetch</Label
			>
		</div>
	{/snippet}
</Story>

<Story name="All States">
	{#snippet template(args: SwitchProps)}
		<div class="grid grid-cols-4 gap-6">
			<div class="flex flex-col items-center gap-2">
				<span class="text-xs text-foreground-subtle">Off</span>
				<Switch {...args} />
			</div>
			<div class="flex flex-col items-center gap-2">
				<span class="text-xs text-foreground-subtle">On</span>
				<Switch checked />
			</div>
			<div class="flex flex-col items-center gap-2">
				<span class="text-xs text-foreground-subtle">Disabled Off</span>
				<Switch disabled />
			</div>
			<div class="flex flex-col items-center gap-2">
				<span class="text-xs text-foreground-subtle">Disabled On</span>
				<Switch disabled checked />
			</div>
			<div class="col-span-4 flex flex-col gap-2">
				<span class="text-xs text-foreground-subtle">With label</span>
				<div class="flex items-center gap-2.5">
					<Switch id="sw-label-demo" checked />
					<Label for="sw-label-demo" class="mb-0 cursor-pointer text-(length:--text-md)"
						>Auto-fetch every 5 min</Label
					>
				</div>
			</div>
		</div>
	{/snippet}
</Story>
