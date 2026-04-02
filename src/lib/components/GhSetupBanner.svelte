<script lang="ts">
	import type { GhCliAvailability } from '$lib/types/github';
	import { AlertTriangle } from 'lucide-svelte';

	interface Props {
		availability: GhCliAvailability;
	}

	let { availability }: Props = $props();
</script>

{#if availability === 'not-installed'}
	<div
		class="flex items-center gap-2 rounded border border-yellow-800/50 bg-yellow-900/20 px-3 py-2 text-xs text-yellow-300"
	>
		<AlertTriangle size={14} />
		<span>
			GitHub CLI not found. Install from
			<a
				href="https://cli.github.com"
				class="underline hover:text-yellow-200"
				target="_blank"
				rel="noopener noreferrer">cli.github.com</a
			>
			to enable sync.
		</span>
	</div>
{:else if availability === 'not-authenticated'}
	<div
		class="flex items-center gap-2 rounded border border-yellow-800/50 bg-yellow-900/20 px-3 py-2 text-xs text-yellow-300"
	>
		<AlertTriangle size={14} />
		<span>
			GitHub CLI not authenticated. Run
			<code class="rounded bg-neutral-800 px-1 py-0.5 font-mono">gh auth login</code>
			to connect.
		</span>
	</div>
{/if}
