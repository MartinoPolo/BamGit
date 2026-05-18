<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, userEvent } from 'storybook/test';
	import * as Accordion from './index.js';

	const { Story } = defineMeta({
		title: 'Base/Accordion',
		component: Accordion.Root,
		tags: ['autodocs'],
	});

	/** Query only accordion trigger buttons via the bits-ui data attribute. */
	function getAccordionTriggers(canvasElement: HTMLElement): HTMLElement[] {
		return Array.from(canvasElement.querySelectorAll('[data-accordion-trigger]'));
	}

	const playSingleOpenSwitches = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const triggers = getAccordionTriggers(canvasElement);

		// Starts with item-1 expanded
		await expect(triggers[0]).toHaveAttribute('data-state', 'open');
		await expect(triggers[1]).toHaveAttribute('data-state', 'closed');
		await expect(triggers[2]).toHaveAttribute('data-state', 'closed');

		// Click item-2 — should open it and close item-1 (single mode)
		await userEvent.click(triggers[1]);
		await expect(triggers[0]).toHaveAttribute('data-state', 'closed');
		await expect(triggers[1]).toHaveAttribute('data-state', 'open');

		// Click item-3 — should open it and close item-2
		await userEvent.click(triggers[2]);
		await expect(triggers[1]).toHaveAttribute('data-state', 'closed');
		await expect(triggers[2]).toHaveAttribute('data-state', 'open');
	};

	const playMultipleBothOpen = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const triggers = getAccordionTriggers(canvasElement);

		// "Multiple Open" starts with item-1 and item-2 expanded
		await expect(triggers[0]).toHaveAttribute('data-state', 'open');
		await expect(triggers[1]).toHaveAttribute('data-state', 'open');
		await expect(triggers[2]).toHaveAttribute('data-state', 'closed');

		// Expand third item — all three should be open
		await userEvent.click(triggers[2]);
		await expect(triggers[0]).toHaveAttribute('data-state', 'open');
		await expect(triggers[1]).toHaveAttribute('data-state', 'open');
		await expect(triggers[2]).toHaveAttribute('data-state', 'open');
	};

	const playDisabledNoChange = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const triggers = getAccordionTriggers(canvasElement);

		// "Disabled Item" — item-1 expanded, item-2 disabled, item-3 collapsed
		await expect(triggers[0]).toHaveAttribute('data-state', 'open');
		await expect(triggers[1]).toBeDisabled();
		await expect(triggers[2]).toHaveAttribute('data-state', 'closed');

		// Disabled trigger should not be clickable (pointer-events: none)
		await expect(triggers[1]).toHaveAttribute('data-state', 'closed');

		// First item should still be expanded
		await expect(triggers[0]).toHaveAttribute('data-state', 'open');
	};

	const playKeyboardToggle = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const triggers = getAccordionTriggers(canvasElement);

		// All start collapsed
		await expect(triggers[0]).toHaveAttribute('data-state', 'closed');

		// Focus first trigger and press Enter — should expand
		(triggers[0] as HTMLButtonElement).focus();
		await userEvent.keyboard('{Enter}');
		await expect(triggers[0]).toHaveAttribute('data-state', 'open');

		// Press Space on same trigger — should collapse
		await userEvent.keyboard(' ');
		await expect(triggers[0]).toHaveAttribute('data-state', 'closed');

		// Focus second trigger and press Space — should expand
		(triggers[1] as HTMLButtonElement).focus();
		await userEvent.keyboard(' ');
		await expect(triggers[1]).toHaveAttribute('data-state', 'open');
	};
</script>

<Story name="Single Open [play: switches items open]" play={playSingleOpenSwitches}>
	{#snippet template()}
		<div class="w-80">
			<Accordion.Root type="single" value="item-1">
				<Accordion.Item value="item-1">
					<Accordion.Trigger>What is Grovekeeper?</Accordion.Trigger>
					<Accordion.Content>
						Grovekeeper is an AI-powered development tool that manages agent sessions
						and GitHub issues autonomously.
					</Accordion.Content>
				</Accordion.Item>
				<Accordion.Item value="item-2">
					<Accordion.Trigger>How does it work?</Accordion.Trigger>
					<Accordion.Content>
						It integrates with your repository and spawns AI agents to work on issues
						based on configurable rules and priorities.
					</Accordion.Content>
				</Accordion.Item>
				<Accordion.Item value="item-3">
					<Accordion.Trigger>Which AI models are supported?</Accordion.Trigger>
					<Accordion.Content>
						Claude, GPT-4, and other leading models are supported via configurable
						providers.
					</Accordion.Content>
				</Accordion.Item>
			</Accordion.Root>
		</div>
	{/snippet}
</Story>

<Story name="Multiple Open [play: multiple items open]" play={playMultipleBothOpen}>
	{#snippet template()}
		<div class="w-80">
			<Accordion.Root type="multiple" value={['item-1', 'item-2']}>
				<Accordion.Item value="item-1">
					<Accordion.Trigger>What is Grovekeeper?</Accordion.Trigger>
					<Accordion.Content>
						Grovekeeper is an AI-powered development tool that manages agent sessions
						and GitHub issues autonomously.
					</Accordion.Content>
				</Accordion.Item>
				<Accordion.Item value="item-2">
					<Accordion.Trigger>How does it work?</Accordion.Trigger>
					<Accordion.Content>
						It integrates with your repository and spawns AI agents to work on issues
						based on configurable rules and priorities.
					</Accordion.Content>
				</Accordion.Item>
				<Accordion.Item value="item-3">
					<Accordion.Trigger>Which AI models are supported?</Accordion.Trigger>
					<Accordion.Content>
						Claude, GPT-4, and other leading models are supported via configurable
						providers.
					</Accordion.Content>
				</Accordion.Item>
			</Accordion.Root>
		</div>
	{/snippet}
</Story>

<Story name="Disabled Item [play: disabled no change]" play={playDisabledNoChange}>
	{#snippet template()}
		<div class="w-80">
			<Accordion.Root type="single" value="item-1">
				<Accordion.Item value="item-1">
					<Accordion.Trigger>What is Grovekeeper?</Accordion.Trigger>
					<Accordion.Content>
						Grovekeeper is an AI-powered development tool that manages agent sessions
						and GitHub issues autonomously.
					</Accordion.Content>
				</Accordion.Item>
				<Accordion.Item value="item-2" disabled>
					<Accordion.Trigger>How does it work? (disabled)</Accordion.Trigger>
					<Accordion.Content>
						It integrates with your repository and spawns AI agents to work on issues
						based on configurable rules and priorities.
					</Accordion.Content>
				</Accordion.Item>
				<Accordion.Item value="item-3">
					<Accordion.Trigger>Which AI models are supported?</Accordion.Trigger>
					<Accordion.Content>
						Claude, GPT-4, and other leading models are supported via configurable
						providers.
					</Accordion.Content>
				</Accordion.Item>
			</Accordion.Root>
		</div>
	{/snippet}
</Story>

<Story name="Keyboard Navigation [play: keyboard toggle]" play={playKeyboardToggle}>
	{#snippet template()}
		<div class="w-80">
			<div
				class="mb-4 rounded-md border border-border bg-muted/50 p-3 text-sm text-muted-foreground"
			>
				<p class="mb-1 font-medium text-foreground">Keyboard shortcuts</p>
				<ul class="flex flex-col gap-0.5">
					<li>
						<kbd class="rounded bg-muted px-1 font-mono text-xs">Enter</kbd> /
						<kbd class="rounded bg-muted px-1 font-mono text-xs">Space</kbd> — Toggle item
					</li>
					<li>
						<kbd class="rounded bg-muted px-1 font-mono text-xs">↓</kbd> /
						<kbd class="rounded bg-muted px-1 font-mono text-xs">↑</kbd> — Move focus between
						items
					</li>
					<li>
						<kbd class="rounded bg-muted px-1 font-mono text-xs">Home</kbd> /
						<kbd class="rounded bg-muted px-1 font-mono text-xs">End</kbd> — Jump to first
						/ last item
					</li>
				</ul>
			</div>
			<Accordion.Root type="single">
				<Accordion.Item value="item-1">
					<Accordion.Trigger>What is Grovekeeper?</Accordion.Trigger>
					<Accordion.Content>
						Grovekeeper is an AI-powered development tool that manages agent sessions
						and GitHub issues autonomously.
					</Accordion.Content>
				</Accordion.Item>
				<Accordion.Item value="item-2">
					<Accordion.Trigger>How does it work?</Accordion.Trigger>
					<Accordion.Content>
						It integrates with your repository and spawns AI agents to work on issues
						based on configurable rules and priorities.
					</Accordion.Content>
				</Accordion.Item>
				<Accordion.Item value="item-3">
					<Accordion.Trigger>Which AI models are supported?</Accordion.Trigger>
					<Accordion.Content>
						Claude, GPT-4, and other leading models are supported via configurable
						providers.
					</Accordion.Content>
				</Accordion.Item>
			</Accordion.Root>
		</div>
	{/snippet}
</Story>
