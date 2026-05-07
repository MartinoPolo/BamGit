<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ChatMessage from './ChatMessage.svelte';
	import ThemeDecorator from '$lib/storybook/ThemeDecorator.svelte';

	const { Story } = defineMeta({
		title: 'Chat/ChatMessage',
		component: ChatMessage,
		// @ts-expect-error — Storybook decorator typing doesn't match Svelte 5 Component type
		decorators: [() => ThemeDecorator],
		tags: ['autodocs'],
	});
</script>

<script lang="ts">
	import type { ChatMessage as ChatMessageType } from '$lib/modules/chat/index.js';
	import ContentDimmer from './ContentDimmer.svelte';
	import StreamingCaret from './StreamingCaret.svelte';
	import CodeBlock from './CodeBlock.svelte';
	import SystemMessage from './SystemMessage.svelte';
	import InlineImage from './InlineImage.svelte';
</script>

<Story name="User Message">
	{#snippet template()}
		<div class="mx-auto max-w-[900px]">
			<ChatMessage
				message={{
					id: '1',
					role: 'user',
					content:
						'Implement the provider trait for OpenCode. Follow the same pattern as the Claude Code provider but handle the different authentication flow.',
					timestamp: Date.now(),
				}}
			/>
		</div>
	{/snippet}
</Story>

<Story name="Assistant Message (Markdown)">
	{#snippet template()}
		<div class="mx-auto max-w-[900px]">
			<ChatMessage
				message={{
					id: '2',
					role: 'assistant',
					content:
						"I'll examine the existing **Claude Code** provider to understand the pattern.\n\n## Plan\n\n1. Read the provider trait definition\n2. Implement `spawn()`, `send_message()`, and `handle_tool_result()`\n3. Add authentication using OAuth2 PKCE flow\n\nHere's the trait we need to implement:\n\n```rust\npub trait Provider {\n    fn spawn(&self) -> Result<Session>;\n    fn send_message(&self, msg: &str) -> Result<()>;\n}\n```\n\nLet me check the existing implementation in `src/providers/claude_code.rs`.",
					timestamp: Date.now(),
				}}
			/>
		</div>
	{/snippet}
</Story>

<Story name="Assistant Message (Streaming)">
	{#snippet template()}
		<div class="mx-auto max-w-[900px]">
			<ChatMessage
				message={{
					id: '3',
					role: 'assistant',
					content: "I'll run the test suite to verify everything compiles correctly",
					timestamp: Date.now(),
				}}
				streaming={true}
			/>
		</div>
	{/snippet}
</Story>

<Story name="System Message">
	{#snippet template()}
		<div class="mx-auto max-w-[900px] space-y-2">
			<ChatMessage
				message={{
					id: '4',
					role: 'system',
					content: 'Session started · Claude Code · feat/session-ui',
					timestamp: Date.now(),
				}}
			/>
			<ChatMessage
				message={{
					id: '5',
					role: 'system',
					content: 'Session completed',
					timestamp: Date.now(),
				}}
			/>
		</div>
	{/snippet}
</Story>

<Story name="Tool Cards">
	{#snippet template()}
		<div class="mx-auto max-w-[900px] space-y-1.5">
			<ChatMessage
				message={{
					id: '6',
					role: 'tool',
					content: '',
					timestamp: Date.now(),
					toolName: 'Read',
					toolUseId: 'tu_1',
					toolStatus: 'success',
					toolInput: { file_path: 'src/providers/claude_code.rs' },
				}}
			/>
			<ChatMessage
				message={{
					id: '7',
					role: 'tool',
					content: '',
					timestamp: Date.now(),
					toolName: 'Bash',
					toolUseId: 'tu_2',
					toolStatus: 'running',
					toolInput: { command: 'cargo test --workspace' },
				}}
			/>
			<ChatMessage
				message={{
					id: '8',
					role: 'tool',
					content: '',
					timestamp: Date.now(),
					toolName: 'Grep',
					toolUseId: 'tu_3',
					toolStatus: 'success',
					toolInput: { pattern: 'impl Provider' },
				}}
			/>
			<ChatMessage
				message={{
					id: '9',
					role: 'tool',
					content: '',
					timestamp: Date.now(),
					toolName: 'Edit',
					toolUseId: 'tu_4',
					toolStatus: 'error',
					toolInput: { file_path: 'src/providers/mod.rs' },
					isError: true,
				}}
			/>
		</div>
	{/snippet}
</Story>

<Story name="Content Dimming">
	{#snippet template()}
		<div class="mx-auto max-w-[900px] space-y-2.5">
			<ContentDimmer dimmed={true}>
				<SystemMessage content="Session started · Claude Code · feat/session-ui" />
				<ChatMessage
					message={{
						id: '10',
						role: 'user',
						content: 'Implement the OpenCode provider.',
						timestamp: Date.now(),
					}}
				/>
				<ChatMessage
					message={{
						id: '11',
						role: 'assistant',
						content:
							"I'll examine the existing provider to understand the pattern, then implement it.",
						timestamp: Date.now(),
					}}
				/>
				<ChatMessage
					message={{
						id: '12',
						role: 'tool',
						content: '',
						timestamp: Date.now(),
						toolName: 'Read',
						toolUseId: 'tu_5',
						toolStatus: 'success',
						toolInput: { file_path: 'src/providers/claude_code.rs' },
					}}
				/>
			</ContentDimmer>
			<ChatMessage
				message={{
					id: '13',
					role: 'user',
					content: 'Now run the tests to make sure everything passes.',
					timestamp: Date.now(),
				}}
			/>
			<ChatMessage
				message={{
					id: '14',
					role: 'assistant',
					content: 'Running the test suite now to verify',
					timestamp: Date.now(),
				}}
				streaming={true}
			/>
		</div>
	{/snippet}
</Story>

<Story name="CodeBlock Component">
	{#snippet template()}
		<div class="mx-auto max-w-[900px] space-y-4">
			<CodeBlock
				language="typescript"
				code={`export interface Provider {\n  spawn(): Promise<Session>;\n  sendMessage(msg: string): Promise<void>;\n  handleToolResult(id: string, result: unknown): Promise<void>;\n}`}
			/>
			<CodeBlock
				language="bash"
				code={`$ cargo test --workspace\n   Compiling grovekeeper v0.8.0\nrunning 24 tests...\ntest providers::claude_code::tests::test_spawn ... ok\ntest providers::opencode::tests::test_auth ... ok`}
			/>
			<CodeBlock code="plain text without language label" />
		</div>
	{/snippet}
</Story>

<Story name="Streaming Caret">
	{#snippet template()}
		<div class="mx-auto max-w-[900px]">
			<p class="text-[13px] text-foreground">
				Some text with a streaming indicator<StreamingCaret />
			</p>
		</div>
	{/snippet}
</Story>

<Story name="Inline Image">
	{#snippet template()}
		<div class="mx-auto max-w-[900px] flex gap-4">
			<InlineImage
				src="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='120'><rect fill='%23334155' width='200' height='120' rx='8'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-size='14'>Image #1</text></svg>"
				imageNumber={1}
			/>
			<InlineImage
				src="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='120'><rect fill='%231e3a5f' width='200' height='120' rx='8'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-size='14'>Image #2</text></svg>"
				imageNumber={2}
			/>
		</div>
	{/snippet}
</Story>
