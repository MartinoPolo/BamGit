<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import PlusIcon from '@lucide/svelte/icons/plus';

	interface Props {
		onclick: () => void;
	}

	let { onclick }: Props = $props();
</script>

<button class="block w-full text-left" {onclick}>
	<Card.Card
		padding="none"
		class="flex h-full min-h-[140px] cursor-pointer items-center justify-center border-2 border-dashed border-border transition-all duration-200 hover:border-border-strong hover:bg-muted/30"
	>
		<div class="flex flex-col items-center gap-2 text-muted-foreground">
			<PlusIcon class="size-6" />
			<span class="text-sm font-medium">Add workspace</span>
		</div>
	</Card.Card>
</button>
