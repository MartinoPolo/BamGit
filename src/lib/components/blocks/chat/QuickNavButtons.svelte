<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { Button } from '$lib/components/ui/button/index.js';

	interface Props {
		showJumpToPrompt: boolean;
		showJumpToResponse: boolean;
		onJumpToPrompt: () => void;
		onJumpToResponse: () => void;
	}

	let { showJumpToPrompt, showJumpToResponse, onJumpToPrompt, onJumpToResponse }: Props =
		$props();
</script>

{#if showJumpToPrompt || showJumpToResponse}
	<div class="pointer-events-none sticky bottom-36 z-10 flex justify-center gap-2">
		{#if showJumpToPrompt}
			<Button
				variant="secondary"
				size="sm"
				class="pointer-events-auto shadow-md text-[11px]"
				onclick={onJumpToPrompt}
			>
				<ChevronUpIcon class="size-3" />
				{m.chat_jump_to_prompt()}
			</Button>
		{/if}
		{#if showJumpToResponse}
			<Button
				variant="secondary"
				size="sm"
				class="pointer-events-auto shadow-md text-[11px]"
				onclick={onJumpToResponse}
			>
				<ChevronDownIcon class="size-3" />
				{m.chat_jump_to_response()}
			</Button>
		{/if}
	</div>
{/if}
