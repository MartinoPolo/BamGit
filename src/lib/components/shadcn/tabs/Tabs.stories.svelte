<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, userEvent, waitFor, within } from 'storybook/test';
	import * as Tabs from './index.js';

	const { Story } = defineMeta({
		title: 'Base/Tabs',
		component: Tabs.Root,
		tags: ['autodocs'],
	});

	const playTabSwitchSecond = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);
		const tabs = canvas.getAllByRole('tab');

		// Initial state — first tab active
		await expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
		await expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
		await expect(tabs[2]).toHaveAttribute('aria-selected', 'false');

		// Click second tab
		tabs[1].click();
		await waitFor(() => {
			expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
			expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
			expect(tabs[2]).toHaveAttribute('aria-selected', 'false');
		});
	};

	const playTabSwitchThird = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);
		const tabs = canvas.getAllByRole('tab');

		// Initial state — first tab active
		await expect(tabs[0]).toHaveAttribute('aria-selected', 'true');

		// Click third tab
		tabs[2].click();
		await waitFor(() => {
			expect(tabs[2]).toHaveAttribute('aria-selected', 'true');
			expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
			expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
		});
	};

	const playDisabledTabIgnored = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);
		const tabs = canvas.getAllByRole('tab');

		// First tab starts active
		await expect(tabs[0]).toHaveAttribute('aria-selected', 'true');

		// Click disabled tab (third tab)
		tabs[2].click();

		// First tab must remain active — disabled tab must not activate
		await waitFor(() => {
			expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
			expect(tabs[2]).toHaveAttribute('aria-selected', 'false');
		});
	};

	const playKeyboardActivation = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);
		const tabs = canvas.getAllByRole('tab');

		// Initial state — first tab active
		await expect(tabs[0]).toHaveAttribute('aria-selected', 'true');

		// Focus first tab and arrow right to second, then press Enter
		(tabs[0] as HTMLButtonElement).focus();
		await userEvent.keyboard('{ArrowRight}');
		await waitFor(() => {
			expect(tabs[1]).toHaveFocus();
		});
		await userEvent.keyboard('{Enter}');
		await waitFor(() => {
			expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
			expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
		});

		// Arrow right to third tab and press Space
		await userEvent.keyboard('{ArrowRight}');
		await waitFor(() => {
			expect(tabs[2]).toHaveFocus();
		});
		await userEvent.keyboard(' ');
		await waitFor(() => {
			expect(tabs[2]).toHaveAttribute('aria-selected', 'true');
			expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
		});
	};
</script>

<script lang="ts">
	import { Badge } from '$lib/components/shadcn/badge/index.js';
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import ActivityIcon from '@lucide/svelte/icons/activity';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import StoryKeyboardHints from '$lib/storybook/StoryKeyboardHints.svelte';
	import KeyboardHint from '$lib/storybook/KeyboardHint.svelte';
</script>

<Story name="All Variants">
	{#snippet template()}
		<div class="flex flex-col gap-4">
			<Tabs.Root value="active">
				<Tabs.List>
					<Tabs.Trigger value="active">Active</Tabs.Trigger>
					<Tabs.Trigger value="inactive">Inactive</Tabs.Trigger>
					<Tabs.Trigger value="disabled" disabled>Disabled</Tabs.Trigger>
				</Tabs.List>
			</Tabs.Root>
		</div>
	{/snippet}
</Story>

<Story name="Default [play: tab switch second]" play={playTabSwitchSecond}>
	{#snippet template()}
		<Tabs.Root value="overview">
			<Tabs.List>
				<Tabs.Trigger value="overview">Overview</Tabs.Trigger>
				<Tabs.Trigger value="activity">Activity</Tabs.Trigger>
				<Tabs.Trigger value="settings">Settings</Tabs.Trigger>
			</Tabs.List>
		</Tabs.Root>
	{/snippet}
</Story>

<Story name="With Icons [play: tab switch third]" play={playTabSwitchThird}>
	{#snippet template()}
		<Tabs.Root value="dashboard">
			<Tabs.List>
				<Tabs.Trigger value="dashboard">
					<LayoutDashboardIcon />
					Dashboard
				</Tabs.Trigger>
				<Tabs.Trigger value="activity">
					<ActivityIcon />
					Activity
				</Tabs.Trigger>
				<Tabs.Trigger value="settings">
					<SettingsIcon />
					Settings
				</Tabs.Trigger>
			</Tabs.List>
		</Tabs.Root>
	{/snippet}
</Story>

<Story name="With Disabled Tab [play: disabled tab ignored]" play={playDisabledTabIgnored}>
	{#snippet template()}
		<Tabs.Root value="active">
			<Tabs.List>
				<Tabs.Trigger value="active">Active</Tabs.Trigger>
				<Tabs.Trigger value="normal">Normal</Tabs.Trigger>
				<Tabs.Trigger value="locked" disabled>Disabled</Tabs.Trigger>
			</Tabs.List>
		</Tabs.Root>
	{/snippet}
</Story>

<Story name="With Badge [play: keyboard activation]" play={playKeyboardActivation}>
	{#snippet template()}
		<div>
			<StoryKeyboardHints>
				<KeyboardHint keys="Enter / Space" action="Activate focused tab" />
				<KeyboardHint keys="→ / ←" action="Move focus between tabs" />
			</StoryKeyboardHints>
			<Tabs.Root value="inbox">
				<Tabs.List>
					<Tabs.Trigger value="inbox">
						Inbox
						<Badge tone="primary" class="ml-1">3</Badge>
					</Tabs.Trigger>
					<Tabs.Trigger value="drafts">Drafts</Tabs.Trigger>
					<Tabs.Trigger value="archive">Archive</Tabs.Trigger>
				</Tabs.List>
			</Tabs.Root>
		</div>
	{/snippet}
</Story>

<Story name="Many Tabs">
	{#snippet template()}
		<Tabs.Root value="day">
			<Tabs.List>
				<Tabs.Trigger value="day">Day</Tabs.Trigger>
				<Tabs.Trigger value="week">Week</Tabs.Trigger>
				<Tabs.Trigger value="month">Month</Tabs.Trigger>
				<Tabs.Trigger value="quarter">Quarter</Tabs.Trigger>
				<Tabs.Trigger value="year">Year</Tabs.Trigger>
			</Tabs.List>
		</Tabs.Root>
	{/snippet}
</Story>

<Story name="With Content">
	{#snippet template()}
		<Tabs.Root value="overview" class="w-96">
			<Tabs.List>
				<Tabs.Trigger value="overview">Overview</Tabs.Trigger>
				<Tabs.Trigger value="activity">Activity</Tabs.Trigger>
				<Tabs.Trigger value="settings">Settings</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="overview" class="mt-4 text-sm text-foreground-muted">
				Overview content — summary of the current project status and key metrics.
			</Tabs.Content>
			<Tabs.Content value="activity" class="mt-4 text-sm text-foreground-muted">
				Activity content — recent events, commits, and agent sessions.
			</Tabs.Content>
			<Tabs.Content value="settings" class="mt-4 text-sm text-foreground-muted">
				Settings content — configure project preferences, integrations, and access.
			</Tabs.Content>
		</Tabs.Root>
	{/snippet}
</Story>
