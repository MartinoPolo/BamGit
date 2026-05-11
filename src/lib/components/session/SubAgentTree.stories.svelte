<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import SubAgentTree from './SubAgentTree.svelte';
	import ThemeDecorator from '$lib/storybook/ThemeDecorator.svelte';

	const { Story } = defineMeta({
		title: 'Blocks/Session/SubAgentTree',
		// @ts-expect-error — Storybook decorator typing doesn't match Svelte 5 Component type
		decorators: [() => ThemeDecorator],
	});
</script>

<script lang="ts">
	import type { SubAgent } from './sub_agent_types.js';
	import SubAgentExpansion from './SubAgentExpansion.svelte';
	import { ToolCardCompact } from '$lib/components/chat/index.js';

	const canonicalTree: SubAgent[] = [
		{
			id: 'main',
			name: 'Main session',
			model: 'Opus 4.7',
			status: 'running',
			toolCount: 45,
			duration: '4m 12s',
			children: [
				{
					id: 'explore',
					name: 'Explore codebase structure',
					model: 'Sonnet',
					status: 'completed',
					toolCount: 12,
					duration: '23s',
					children: [],
				},
				{
					id: 'review',
					name: 'Review error handling',
					model: 'Sonnet',
					status: 'completed',
					toolCount: 8,
					duration: '15s',
					children: [
						{
							id: 'fetch-docs',
							name: 'Fetch library docs',
							model: 'Haiku',
							status: 'completed',
							toolCount: 3,
							duration: '4s',
							children: [],
						},
					],
				},
				{
					id: 'implement',
					name: 'Implement provider trait',
					model: 'Sonnet',
					status: 'running',
					toolCount: 5,
					duration: '…',
					children: [],
				},
				{
					id: 'test',
					name: 'Run test suite',
					model: 'Haiku',
					status: 'failed',
					toolCount: 2,
					duration: '8s',
					children: [],
				},
			],
		},
	];

	const emptyTree: SubAgent[] = [];

	const singleAgent: SubAgent[] = [
		{
			id: 'main',
			name: 'Main session',
			model: 'Opus 4.7',
			status: 'running',
			toolCount: 12,
			duration: '1m 30s',
			children: [
				{
					id: 'review-auth',
					name: 'Review auth module',
					model: 'Sonnet',
					status: 'running',
					toolCount: 4,
					duration: '…',
					children: [],
				},
			],
		},
	];

	const deepTree: SubAgent[] = [
		{
			id: 'main',
			name: 'Main session',
			model: 'Opus 4.7',
			status: 'running',
			toolCount: 82,
			duration: '8m 45s',
			children: [
				{
					id: 'auth',
					name: 'Implement auth system',
					model: 'Sonnet',
					status: 'running',
					toolCount: 34,
					duration: '5m 12s',
					children: [
						{
							id: 'research',
							name: 'Research OAuth2 crates',
							model: 'Haiku',
							status: 'completed',
							toolCount: 6,
							duration: '12s',
							children: [],
						},
						{
							id: 'pkce',
							name: 'Write PKCE module',
							model: 'Sonnet',
							status: 'completed',
							toolCount: 14,
							duration: '2m 8s',
							children: [
								{
									id: 'fixtures',
									name: 'Generate test fixtures',
									model: 'Haiku',
									status: 'completed',
									toolCount: 3,
									duration: '5s',
									children: [
										{
											id: 'rfc',
											name: 'Fetch RFC examples',
											model: 'Haiku',
											status: 'completed',
											toolCount: 2,
											duration: '3s',
											children: [],
										},
									],
								},
							],
						},
					],
				},
			],
		},
	];
</script>

<Story name="Canonical Tree">
	{#snippet template()}
		<div class="w-65 rounded-lg border border-border bg-(--sidebar-bg,var(--surface)) p-2">
			<SubAgentTree agents={canonicalTree} activeAgentId="explore" />
		</div>
	{/snippet}
</Story>

<Story name="Empty">
	{#snippet template()}
		<div class="w-65 rounded-lg border border-border bg-(--sidebar-bg,var(--surface)) p-2">
			<SubAgentTree agents={emptyTree} />
			<div class="py-5 text-center text-[11px] text-foreground-subtle">
				No sub-agents spawned yet
			</div>
		</div>
	{/snippet}
</Story>

<Story name="Single Agent">
	{#snippet template()}
		<div class="w-65 rounded-lg border border-border bg-(--sidebar-bg,var(--surface)) p-2">
			<SubAgentTree agents={singleAgent} />
		</div>
	{/snippet}
</Story>

<Story name="Deep Nesting (4+ levels)">
	{#snippet template()}
		<div class="w-65 rounded-lg border border-border bg-(--sidebar-bg,var(--surface)) p-2">
			<SubAgentTree agents={deepTree} />
		</div>
	{/snippet}
</Story>

<Story name="Inline Expansion">
	{#snippet template()}
		<div class="mx-auto max-w-225 space-y-2 p-4">
			<div class="text-[13px] text-foreground">Assistant message before sub-agent...</div>
			<SubAgentExpansion
				name="Explore codebase structure"
				model="Sonnet"
				toolCount={12}
				duration="23s"
			>
				<div class="text-[13px] leading-normal text-foreground-muted">
					Exploring the project structure to understand codebase layout.
				</div>
				<ToolCardCompact
					message={{
						id: 'sub-1',
						role: 'tool',
						content: '',
						timestamp: Date.now(),
						toolName: 'Glob',
						toolUseId: 'tu_sub1',
						toolStatus: 'success',
						toolInput: { pattern: '**/*.rs' },
					}}
				/>
				<ToolCardCompact
					message={{
						id: 'sub-2',
						role: 'tool',
						content: '',
						timestamp: Date.now(),
						toolName: 'Read',
						toolUseId: 'tu_sub2',
						toolStatus: 'success',
						toolInput: { file_path: 'src/main.rs' },
					}}
				/>
				<div class="text-[13px] leading-normal text-foreground-muted">
					Found 23 Rust source files in 4 modules.
				</div>
			</SubAgentExpansion>
			<div class="text-[13px] text-foreground">Assistant message after sub-agent...</div>
		</div>
	{/snippet}
</Story>
