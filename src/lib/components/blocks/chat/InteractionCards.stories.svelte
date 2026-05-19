<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, fn, userEvent, within } from 'storybook/test';
	import ToolCardPermission from './ToolCardPermission.svelte';
	import type { ChatMessage } from '$lib/modules/chat/index.js';

	const { Story } = defineMeta({
		title: 'Blocks/Chat/InteractionCards',
	});

	const permissionMessage: ChatMessage = {
		id: 'perm-1',
		role: 'tool',
		content: 'Permission needed for Bash',
		timestamp: Date.now(),
		toolName: 'Bash',
		toolStatus: 'running',
		toolInput: {
			command: 'rm -rf target/debug/build/grovekeeper-*\ncargo build --release',
		},
		interactionType: 'permission',
		requestId: 'req_1',
	};

	interface PermissionPlayContext {
		canvasElement: HTMLElement;
		args: { onAllow?: unknown; onAllowAlways?: unknown; onDeny?: unknown };
	}

	/** Click Allow button → onAllow fires. */
	const playAllowFires = async ({ canvasElement, args }: PermissionPlayContext) => {
		const canvas = within(canvasElement);
		const onAllowSpy = args.onAllow as ReturnType<typeof fn>;
		onAllowSpy.mockClear();

		const allowButton = canvas.getByRole('button', { name: /^allow$/i });
		await userEvent.click(allowButton);

		await expect(onAllowSpy).toHaveBeenCalledOnce();
	};

	/** Click Deny button → onDeny fires. */
	const playDenyFires = async ({ canvasElement, args }: PermissionPlayContext) => {
		const canvas = within(canvasElement);
		const onDenySpy = args.onDeny as ReturnType<typeof fn>;
		onDenySpy.mockClear();

		const denyButton = canvas.getByRole('button', { name: /deny/i });
		await userEvent.click(denyButton);

		await expect(onDenySpy).toHaveBeenCalledOnce();
	};

	/** Click Allow Always button → onAllowAlways fires, onAllow does NOT fire. */
	const playAllowAlwaysFires = async ({ canvasElement, args }: PermissionPlayContext) => {
		const canvas = within(canvasElement);
		const onAllowSpy = args.onAllow as ReturnType<typeof fn>;
		const onAllowAlwaysSpy = args.onAllowAlways as ReturnType<typeof fn>;
		onAllowSpy.mockClear();
		onAllowAlwaysSpy.mockClear();

		const allowAlwaysButton = canvas.getByRole('button', { name: /allow always/i });
		await userEvent.click(allowAlwaysButton);

		await expect(onAllowAlwaysSpy).toHaveBeenCalledOnce();
		await expect(onAllowSpy).not.toHaveBeenCalled();
	};
</script>

<script lang="ts">
	import ToolCardElicitation from './ToolCardElicitation.svelte';
	import ToolCardAskUser from './ToolCardAskUser.svelte';

	const elicitationMessage: ChatMessage = {
		id: 'elicit-1',
		role: 'tool',
		content:
			'The query requires access to the production database. Please provide the connection string or confirm the environment to use.',
		timestamp: Date.now(),
		toolStatus: 'running',
		toolInput: { server: 'postgres' },
		interactionType: 'elicitation',
		requestId: 'req_2',
	};

	const askUserMessage: ChatMessage = {
		id: 'ask-1',
		role: 'tool',
		content: '',
		timestamp: Date.now(),
		toolStatus: 'running',
		toolInput: {
			question:
				'I found two approaches for the authentication refactor. Which would you prefer?',
			options: [
				'Option A: Full OAuth2 PKCE with refresh tokens (more secure, more complex)',
				'Option B: API key with session tokens (simpler, adequate for dev tools)',
				'Other (describe your preference)',
			],
		},
		interactionType: 'ask-user',
		requestId: 'req_3',
	};
</script>

<Story name="Permission Prompt">
	{#snippet template()}
		<div class="mx-auto max-w-225 p-4">
			<ToolCardPermission message={permissionMessage} />
		</div>
	{/snippet}
</Story>

<Story name="Elicitation Prompt">
	{#snippet template()}
		<div class="mx-auto max-w-225 p-4">
			<ToolCardElicitation message={elicitationMessage} />
		</div>
	{/snippet}
</Story>

<Story name="Ask User (Options)">
	{#snippet template()}
		<div class="mx-auto max-w-225 p-4">
			<ToolCardAskUser message={askUserMessage} />
		</div>
	{/snippet}
</Story>

<Story name="All L3 Types">
	{#snippet template()}
		<div class="mx-auto max-w-225 space-y-3 p-4">
			<ToolCardPermission message={permissionMessage} />
			<ToolCardElicitation message={elicitationMessage} />
			<ToolCardAskUser message={askUserMessage} />
		</div>
	{/snippet}
</Story>

<Story
	name="Allow Fires Callback [play: allow fires callback]"
	args={{ onAllow: fn(), onAllowAlways: fn(), onDeny: fn() }}
	play={playAllowFires}
>
	{#snippet template(args: {
		onAllow?: () => void;
		onAllowAlways?: () => void;
		onDeny?: () => void;
	})}
		<div class="mx-auto max-w-225 p-4">
			<ToolCardPermission
				message={permissionMessage}
				onAllow={args.onAllow}
				onAllowAlways={args.onAllowAlways}
				onDeny={args.onDeny}
			/>
		</div>
	{/snippet}
</Story>

<Story
	name="Deny Fires Callback [play: deny fires callback]"
	args={{ onAllow: fn(), onAllowAlways: fn(), onDeny: fn() }}
	play={playDenyFires}
>
	{#snippet template(args: {
		onAllow?: () => void;
		onAllowAlways?: () => void;
		onDeny?: () => void;
	})}
		<div class="mx-auto max-w-225 p-4">
			<ToolCardPermission
				message={permissionMessage}
				onAllow={args.onAllow}
				onAllowAlways={args.onAllowAlways}
				onDeny={args.onDeny}
			/>
		</div>
	{/snippet}
</Story>

<Story
	name="Allow Always Fires Callback [play: allow always fires callback]"
	args={{ onAllow: fn(), onAllowAlways: fn(), onDeny: fn() }}
	play={playAllowAlwaysFires}
>
	{#snippet template(args: {
		onAllow?: () => void;
		onAllowAlways?: () => void;
		onDeny?: () => void;
	})}
		<div class="mx-auto max-w-225 p-4">
			<ToolCardPermission
				message={permissionMessage}
				onAllow={args.onAllow}
				onAllowAlways={args.onAllowAlways}
				onDeny={args.onDeny}
			/>
		</div>
	{/snippet}
</Story>
