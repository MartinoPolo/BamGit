<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import type { GhCliAvailability } from '$lib/types/generated';
	import AlertTriangle from '@lucide/svelte/icons/alert-triangle';

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
			{m.gh_not_installed_before_link()}
			<a
				href="https://cli.github.com"
				class="underline hover:text-yellow-200"
				target="_blank"
				rel="noopener noreferrer">{m.gh_cli_link()}</a
			>
			{m.gh_not_installed_after_link()}
		</span>
	</div>
{:else if availability === 'not-authenticated'}
	<div
		class="flex items-center gap-2 rounded border border-yellow-800/50 bg-yellow-900/20 px-3 py-2 text-xs text-yellow-300"
	>
		<AlertTriangle size={14} />
		<span>
			{m.gh_not_authenticated_before_command()}
			<code class="rounded bg-muted px-1 py-0.5 font-mono">{m.gh_auth_command()}</code>
			{m.gh_not_authenticated_after_command()}
		</span>
	</div>
{/if}
