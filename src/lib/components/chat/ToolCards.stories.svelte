<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ToolCardExpanded from './ToolCardExpanded.svelte';
	import ThemeDecorator from '$lib/storybook/ThemeDecorator.svelte';

	const { Story } = defineMeta({
		title: 'Blocks/Chat/ToolCards',
		// @ts-expect-error — Storybook decorator typing doesn't match Svelte 5 Component type
		decorators: [() => ThemeDecorator],
	});
</script>

<script lang="ts">
	import ToolCardCompact from './ToolCardCompact.svelte';
	import ToolCardGroup from './ToolCardGroup.svelte';
	import type { ChatMessage } from '$lib/modules/chat/index.js';

	function makeTool(overrides: Partial<ChatMessage>): ChatMessage {
		return {
			id: crypto.randomUUID(),
			role: 'tool',
			content: '',
			timestamp: Date.now(),
			toolName: 'Bash',
			toolUseId: crypto.randomUUID(),
			toolStatus: 'success',
			...overrides,
		};
	}

	const bashRunning = makeTool({
		toolName: 'Bash',
		toolStatus: 'running',
		toolInput: { command: 'cargo test --workspace' },
		toolOutput:
			'   Compiling grovekeeper v0.8.0\n   Compiling grovekeeper-providers v0.8.0\n     Running unittests src/lib.rs\nrunning 24 tests...\ntest providers::claude_code::tests::test_spawn ... ok',
	});

	const bashError = makeTool({
		toolName: 'Bash',
		toolStatus: 'error',
		isError: true,
		toolInput: { command: 'cargo build --release' },
		toolOutput:
			'error[E0308]: mismatched types\n  --> src/providers/opencode.rs:42:12\n   |\n42 |     return Ok(session);\n   |            ^^^^^^^^^^^ expected `Result<Session, Error>`,\n   |                        found `Result<Session, AuthError>`',
	});

	const readFile = makeTool({
		toolName: 'Read',
		toolStatus: 'success',
		toolInput: { file_path: 'src/providers/mod.rs' },
		toolOutput:
			'mod claude_code;\nmod opencode;\nmod cursor;\nmod codex;\n\npub use claude_code::ClaudeCode;\npub use opencode::OpenCode;\n\npub trait Provider: Send + Sync {\n    fn spawn(&self, config: &Config) -> Result<Session>;\n}',
	});

	const grepResult = makeTool({
		toolName: 'Grep',
		toolStatus: 'success',
		toolInput: { pattern: 'impl Provider' },
		toolOutput:
			'src/providers/claude_code.rs:24:  impl Provider for ClaudeCode {\nsrc/providers/opencode.rs:18:    impl Provider for OpenCode {\nsrc/providers/cursor.rs:31:      impl Provider for Cursor {',
	});

	const groupMessages = Array.from({ length: 7 }, (_, i) =>
		makeTool({
			id: `group-${i}`,
			toolName: ['Read', 'Grep', 'Edit', 'Bash', 'Read', 'Write', 'Glob'][i],
			toolInput: { file_path: `src/file_${i}.rs` },
		}),
	);
</script>

<Story name="L2 — Bash Running">
	{#snippet template()}
		<div class="mx-auto max-w-225 p-4">
			<ToolCardExpanded message={bashRunning} />
		</div>
	{/snippet}
</Story>

<Story name="L2 — Bash Error">
	{#snippet template()}
		<div class="mx-auto max-w-225 p-4">
			<ToolCardExpanded message={bashError} />
		</div>
	{/snippet}
</Story>

<Story name="L2 — Read File">
	{#snippet template()}
		<div class="mx-auto max-w-225 p-4">
			<ToolCardExpanded message={readFile} />
		</div>
	{/snippet}
</Story>

<Story name="L2 — Grep Matches">
	{#snippet template()}
		<div class="mx-auto max-w-225 p-4">
			<ToolCardExpanded message={grepResult} />
		</div>
	{/snippet}
</Story>

<Story name="L1 Compact (click to expand)">
	{#snippet template()}
		<div class="mx-auto max-w-225 space-y-1.5 p-4">
			<ToolCardCompact message={readFile} />
			<ToolCardCompact message={bashRunning} />
			<ToolCardCompact message={bashError} />
		</div>
	{/snippet}
</Story>

<Story name="Tool Group (collapsed)">
	{#snippet template()}
		<div class="mx-auto max-w-225 p-4">
			<ToolCardGroup messages={groupMessages} />
		</div>
	{/snippet}
</Story>
