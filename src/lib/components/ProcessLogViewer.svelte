<script lang="ts">
	// fallow-ignore-file unused-file
	import { invoke } from '$lib/tauri.js';
	import { listen } from '$lib/tauri.js';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import XIcon from '@lucide/svelte/icons/x';

	interface Props {
		processId: string;
		processName: string;
		onClose: () => void;
	}

	let { processId, processName, onClose }: Props = $props();

	let lines = $state<string[]>([]);
	let logContainer: HTMLDivElement | undefined = $state();
	let autoScroll = $state(true);

	let unlisten: (() => void) | null = $state(null);

	onMount(() => {
		void (async () => {
			try {
				lines = await invoke<string[]>('get_process_logs', { processId });
			} catch {
				lines = ['[Failed to load logs]'];
			}

			unlisten = await listen<[string, string]>('process-output', (event) => {
				const [eventProcessId, line] = event.payload;
				if (eventProcessId === processId) {
					lines = [...lines, line];
					if (autoScroll && logContainer) {
						requestAnimationFrame(() => {
							logContainer!.scrollTop = logContainer!.scrollHeight;
						});
					}
				}
			});
		})();

		return () => {
			unlisten?.();
		};
	});

	function handleScroll() {
		if (logContainer) {
			const { scrollTop, scrollHeight, clientHeight } = logContainer;
			autoScroll = scrollHeight - scrollTop - clientHeight < 50;
		}
	}
</script>

<div class="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface-1">
	<div class="flex items-center justify-between border-b border-border px-3 py-2">
		<span class="text-sm font-medium">{processName} — Logs</span>
		<Button variant="ghost" size="icon-sm" onclick={onClose}>
			<XIcon size={14} />
		</Button>
	</div>
	<div
		bind:this={logContainer}
		onscroll={handleScroll}
		class="flex-1 overflow-auto bg-[oklch(0.15_0_0)] p-3 font-mono text-xs leading-5 text-[oklch(0.85_0_0)]"
	>
		{#each lines as line, index (index)}
			<div class="whitespace-pre-wrap break-all">{line}</div>
		{/each}
		{#if lines.length === 0}
			<div class="text-[oklch(0.5_0_0)]">No output yet...</div>
		{/if}
	</div>
</div>
