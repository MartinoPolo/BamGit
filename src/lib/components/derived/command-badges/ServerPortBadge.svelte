<script lang="ts">
	import { openUrl } from '$lib/opener.js';
	import { Badge } from '$lib/components/shadcn/badge/index.js';
	import * as ContextMenu from '$lib/components/shadcn/context-menu/index.js';
	import TerminalSquareIcon from '@lucide/svelte/icons/terminal-square';
	import XIcon from '@lucide/svelte/icons/x';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import type { ServerPortBadgeProps } from './server_port_badge_types.js';

	let {
		port,
		badgeStyle = 'borderless-dark',
		onclick,
		processId,
		onViewLogs,
		onKillProcess,
	}: ServerPortBadgeProps = $props();

	function handleClick() {
		if (onclick !== undefined) {
			onclick();
		} else {
			void openUrl(`http://localhost:${port}`);
		}
	}

	function handleOpenInBrowser() {
		void openUrl(`http://localhost:${port}`);
	}

	function handleViewLogs() {
		if (onViewLogs !== undefined && processId !== undefined) {
			onViewLogs(processId);
		}
	}

	function handleKillProcess() {
		if (onKillProcess !== undefined && processId !== undefined) {
			onKillProcess(processId);
		}
	}
</script>

{#snippet badgeButton()}
	<button
		type="button"
		class="cursor-pointer select-none hover:brightness-125"
		onclick={handleClick}
		aria-label="Open port {port}"
	>
		<Badge tone="success" {badgeStyle} format="mono" dot="static">
			:{port}
		</Badge>
	</button>
{/snippet}

{#if processId}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div oncontextmenu={(event) => event.stopPropagation()}>
		<ContextMenu.Root>
			<ContextMenu.Trigger>
				{@render badgeButton()}
			</ContextMenu.Trigger>

			<ContextMenu.Content>
				<ContextMenu.Item onclick={handleViewLogs}>
					<TerminalSquareIcon />
					View Logs
				</ContextMenu.Item>

				<ContextMenu.Item variant="destructive" onclick={handleKillProcess}>
					<XIcon />
					Kill
				</ContextMenu.Item>

				<ContextMenu.Separator />

				<ContextMenu.Item onclick={handleOpenInBrowser}>
					<ExternalLinkIcon />
					Open in Browser
				</ContextMenu.Item>
			</ContextMenu.Content>
		</ContextMenu.Root>
	</div>
{:else}
	{@render badgeButton()}
{/if}
