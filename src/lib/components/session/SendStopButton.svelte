<script lang="ts">
	import SendIcon from '@lucide/svelte/icons/send';
	import SquareIcon from '@lucide/svelte/icons/square';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Kbd } from '$lib/components/ui/kbd/index.js';

	interface Props {
		isRunning: boolean;
		disabled?: boolean;
		onSend?: () => void;
		onStop?: () => void;
	}

	let { isRunning, disabled = false, onSend, onStop }: Props = $props();
</script>

{#if isRunning}
	<Button variant="danger" size="icon-sm" onclick={onStop} class="rounded-[7px]">
		<SquareIcon size={11} strokeWidth={2.4} />
	</Button>
{:else}
	<Button variant="primary" size="icon-sm" onclick={onSend} {disabled} class="rounded-[7px]">
		<SendIcon size={13} strokeWidth={2} />
	</Button>
{/if}
