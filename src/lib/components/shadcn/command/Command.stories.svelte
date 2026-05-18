<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, userEvent, waitFor } from 'storybook/test';
	import CommandRoot from './command.svelte';

	const { Story } = defineMeta({
		title: 'Base/Command',
		component: CommandRoot,
		tags: ['autodocs'],
	});

	/* ------------------------------------------------------------------ */
	/*  Helpers                                                            */
	/* ------------------------------------------------------------------ */

	function getCommandInput(canvas: HTMLElement) {
		return canvas.querySelector('[data-command-input]') as HTMLInputElement | null;
	}

	function getCommandItems(canvas: HTMLElement) {
		return [...canvas.querySelectorAll('[data-command-item]')] as HTMLElement[];
	}

	function getCommandEmpty(canvas: HTMLElement) {
		return canvas.querySelector('[data-command-empty]') as HTMLElement | null;
	}

	function getGroupHeadings(canvas: HTMLElement) {
		return [...canvas.querySelectorAll('[data-command-group-heading]')] as HTMLElement[];
	}

	/* ------------------------------------------------------------------ */
	/*  Play tests                                                        */
	/* ------------------------------------------------------------------ */

	const playKeyboardNavigation = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const input = getCommandInput(canvasElement)!;
		await waitFor(() => expect(input).toBeInTheDocument());
		input.focus();

		await waitFor(() => {
			const items = getCommandItems(canvasElement);
			expect(items.length).toBeGreaterThan(1);
			expect(items[0]).toHaveAttribute('data-selected');
		});

		await userEvent.keyboard('{ArrowDown}');
		await waitFor(() => {
			const items = getCommandItems(canvasElement);
			expect(items[1]).toHaveAttribute('data-selected');
			expect(items[0]).not.toHaveAttribute('data-selected');
		});

		await userEvent.keyboard('{ArrowUp}');
		await waitFor(() => {
			const items = getCommandItems(canvasElement);
			expect(items[0]).toHaveAttribute('data-selected');
		});
	};

	const playFiltering = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const input = getCommandInput(canvasElement)!;
		await waitFor(() => expect(input).toBeInTheDocument());
		input.focus();

		await waitFor(() => {
			const items = getCommandItems(canvasElement);
			expect(items.length).toBeGreaterThan(2);
		});

		await userEvent.type(input, 'calendar');

		await waitFor(() => {
			const items = getCommandItems(canvasElement);
			const visibleCount = items.filter(
				(item) => getComputedStyle(item).display !== 'none',
			).length;
			expect(visibleCount).toBeLessThanOrEqual(1);
		});
	};

	const playEmptyState = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const input = getCommandInput(canvasElement)!;
		input.focus();

		await userEvent.type(input, 'xyznonexistent');

		await waitFor(() => {
			const empty = getCommandEmpty(canvasElement);
			expect(empty).toBeVisible();
			expect(empty).toHaveTextContent(/no results/i);
		});
	};

	const playGroupHeadings = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		await waitFor(() => {
			const headings = getGroupHeadings(canvasElement);
			expect(headings.length).toBeGreaterThanOrEqual(2);
		});

		const headings = getGroupHeadings(canvasElement);
		const headingTexts = headings.map((h) => h.textContent?.trim());
		expect(headingTexts).toContain('Navigation');
		expect(headingTexts).toContain('Actions');
	};
</script>

<script lang="ts">
	import * as Command from './index.js';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import UserIcon from '@lucide/svelte/icons/user';
	import HomeIcon from '@lucide/svelte/icons/home';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import PaletteIcon from '@lucide/svelte/icons/palette';
	import StoryKeyboardHints from '$lib/storybook/StoryKeyboardHints.svelte';
	import KeyboardHint from '$lib/storybook/KeyboardHint.svelte';
</script>

<Story name="Default [play: keyboard navigation]" play={playKeyboardNavigation}>
	{#snippet template()}
		<div class="w-100">
			<StoryKeyboardHints>
				<KeyboardHint keys="↓ / ↑" action="Navigate items" />
				<KeyboardHint keys="Enter" action="Select item" />
				<li>Type to filter items</li>
			</StoryKeyboardHints>
			<Command.Root class="rounded-xl border border-border shadow-md">
				<Command.Input placeholder="Search commands..." />
				<Command.List>
					<Command.Group heading="Navigation">
						<Command.Item value="Go to Dashboard">
							<HomeIcon />
							<span>Go to Dashboard</span>
						</Command.Item>
						<Command.Item value="Go to Settings">
							<SettingsIcon />
							<span>Go to Settings</span>
						</Command.Item>
						<Command.Item value="Go to Profile">
							<UserIcon />
							<span>Go to Profile</span>
						</Command.Item>
					</Command.Group>
					<Command.Separator />
					<Command.Group heading="Actions">
						<Command.Item value="Toggle Theme">
							<MoonIcon />
							<span>Toggle Theme</span>
						</Command.Item>
						<Command.Item value="Change Color">
							<PaletteIcon />
							<span>Change Color</span>
						</Command.Item>
					</Command.Group>
					<Command.Empty>No results found.</Command.Empty>
				</Command.List>
			</Command.Root>
		</div>
	{/snippet}
</Story>

<Story name="With Groups [play: group headings]" play={playGroupHeadings}>
	{#snippet template()}
		<div class="w-100">
			<Command.Root class="rounded-xl border border-border shadow-md">
				<Command.Input placeholder="Search..." />
				<Command.List>
					<Command.Group heading="Navigation">
						<Command.Item value="Dashboard"><HomeIcon /> Dashboard</Command.Item>
						<Command.Item value="Settings"><SettingsIcon /> Settings</Command.Item>
					</Command.Group>
					<Command.Separator />
					<Command.Group heading="Actions">
						<Command.Item value="Toggle Theme"><MoonIcon /> Toggle Theme</Command.Item>
					</Command.Group>
					<Command.Empty>No results found.</Command.Empty>
				</Command.List>
			</Command.Root>
		</div>
	{/snippet}
</Story>

<Story name="Empty State [play: empty state]" play={playEmptyState}>
	{#snippet template()}
		<div class="w-100">
			<Command.Root class="rounded-xl border border-border shadow-md">
				<Command.Input placeholder="Type to search..." />
				<Command.List>
					<Command.Group heading="Items">
						<Command.Item value="Alpha">Alpha</Command.Item>
						<Command.Item value="Bravo">Bravo</Command.Item>
					</Command.Group>
					<Command.Empty>No results found.</Command.Empty>
				</Command.List>
			</Command.Root>
		</div>
	{/snippet}
</Story>

<Story name="Filtering [play: filtering]" play={playFiltering}>
	{#snippet template()}
		<div class="w-100">
			<Command.Root class="rounded-xl border border-border shadow-md">
				<Command.Input placeholder="Filter items..." />
				<Command.List>
					<Command.Group heading="Fruits">
						<Command.Item value="Apple">Apple</Command.Item>
						<Command.Item value="Banana">Banana</Command.Item>
						<Command.Item value="Cherry">Cherry</Command.Item>
					</Command.Group>
					<Command.Empty>No results found.</Command.Empty>
				</Command.List>
			</Command.Root>
		</div>
	{/snippet}
</Story>

<Story name="With Shortcuts">
	{#snippet template()}
		<div class="w-100">
			<Command.Root class="rounded-xl border border-border shadow-md">
				<Command.Input placeholder="Search..." />
				<Command.List>
					<Command.Group heading="Actions">
						<Command.Item value="Copy">
							<span>Copy</span>
							<Command.Shortcut>⌘C</Command.Shortcut>
						</Command.Item>
						<Command.Item value="Paste">
							<span>Paste</span>
							<Command.Shortcut>⌘V</Command.Shortcut>
						</Command.Item>
						<Command.Item value="Cut">
							<span>Cut</span>
							<Command.Shortcut>⌘X</Command.Shortcut>
						</Command.Item>
					</Command.Group>
					<Command.Empty>No results found.</Command.Empty>
				</Command.List>
			</Command.Root>
		</div>
	{/snippet}
</Story>
