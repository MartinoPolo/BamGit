<script lang="ts">
	import { fly } from 'svelte/transition';
	import { useToasts } from '$lib/modules/toasts';
	import { Toast } from '$lib/components/ui/toast/index.js';

	const toastsCtx = useToasts();
</script>

{#if toastsCtx.toasts.length > 0}
	<div class="fixed right-4 bottom-4 z-[var(--z-toast)] flex flex-col gap-2">
		{#each toastsCtx.toasts as toast (toast.id)}
			<div transition:fly={{ y: 20, duration: 200 }}>
				<Toast
					tone={toast.tone}
					title={toast.title}
					body={toast.body}
					onDismiss={() => toastsCtx.dismiss(toast.id)}
				/>
			</div>
		{/each}
	</div>
{/if}
