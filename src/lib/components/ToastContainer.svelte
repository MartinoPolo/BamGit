<script lang="ts">
	import { fly } from 'svelte/transition';
	import Toast from '$lib/components/ui/toast/Toast.svelte';
	import { useToasts } from '$lib/modules/toasts/index.js';

	const ctx = useToasts();
</script>

{#if ctx.toasts.current.length > 0}
	<div class="fixed right-4 bottom-4 flex flex-col-reverse gap-2" style:z-index="var(--z-toast)">
		{#each ctx.toasts.current as toast (toast.id)}
			<div transition:fly={{ y: 16, duration: 200 }}>
				<Toast
					tone={toast.tone}
					title={toast.title}
					body={toast.body}
					onDismiss={() => ctx.dismiss(toast.id)}
				/>
			</div>
		{/each}
	</div>
{/if}
