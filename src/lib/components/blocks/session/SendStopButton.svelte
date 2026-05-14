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
	<Button intent="danger" size="icon-sm" onclick={onStop} class="rounded-1.75">
		<SquareIcon size={11} strokeWidth={2.4} />
	</Button>
{:else}
	<Button intent="primary" size="icon-sm" onclick={onSend} {disabled} class="rounded-1.75">
		<SendIcon size={13} strokeWidth={2} />
	</Button>
{/if}
