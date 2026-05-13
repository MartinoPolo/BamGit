<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import * as Accordion from './index.js';

	const { Story } = defineMeta({
		title: 'Base/Accordion',
		component: Accordion.Root,
		tags: ['autodocs'],
	});
</script>

<Story name="Single Open">
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

<Story name="Multiple Open">
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

<Story name="All Collapsed">
	{#snippet template()}
		<div class="w-80">
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

<Story name="Disabled Item">
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
