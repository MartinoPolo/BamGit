<script lang="ts">
	import SendIcon from '@lucide/svelte/icons/send';
	import SquareIcon from '@lucide/svelte/icons/square';
	import { Button } from '$lib/components/shadcn/button/index.js';

	interface Props {
		isRunning: boolean;
		disabled?: boolean;
		onSend?: () => void;
		onStop?: () => void;
	}

	let { isRunning, disabled = false, onSend, onStop }: Props = $props();
</script>

{#if isRunning}
	<Button intent="danger" size="icon-sm" aria-label="Stop" onclick={onStop} class="rounded-1.75">
		<SquareIcon strokeWidth={2.4} data-icon="inline-start" />
	</Button>
{:else}
	<Button
		intent="primary"
		size="icon-sm"
		aria-label="Send message"
		onclick={onSend}
		{disabled}
		class="rounded-1.75"
	>
		<SendIcon strokeWidth={2} data-icon="inline-start" />
	</Button>
{/if}
