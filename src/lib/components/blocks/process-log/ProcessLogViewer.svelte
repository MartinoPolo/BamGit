<script lang="ts">
	import { onDestroy, tick } from 'svelte';
	import * as Dialog from '$lib/components/shadcn/dialog/index.js';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { useProcesses, type ProcessLogLine } from '$lib/modules/processes';
	import type { ProcessStatus } from '$lib/types/generated';
	import { listen, type UnlistenFn } from '$lib/tauri.js';
	import ServerPortBadge from '$lib/components/derived/command-badges/ServerPortBadge.svelte';
	import XIcon from '@lucide/svelte/icons/x';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import CheckIcon from '@lucide/svelte/icons/check';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import TerminalIcon from '@lucide/svelte/icons/terminal';
	import { cn } from '$lib/utils.js';

	const processesCtx = useProcesses();

	const STATUS_DOT_CLASSES = {
		running: 'bg-status-info animate-pulse',
		passed: 'bg-status-success',
		failed: 'bg-status-danger',
		timeout: 'bg-status-warning',
		stopped: 'bg-foreground-subtle',
	} as const;

	const processId = $derived(processesCtx.activeLogViewerProcessId);
	const isOpen = $derived(processId !== null);

	const process = $derived(
		processId !== null
			? (processesCtx.processes.find((p) => p.process_id === processId) ?? null)
			: null,
	);

	const streamingLines = $derived(
		processId !== null ? (processesCtx.logLines.get(processId) ?? []) : [],
	);

	let displayLines = $state<ProcessLogLine[]>([]);
	let fullLogLoaded = $state(false);
	let loadingFullLog = $state(false);
	let autoScroll = $state(true);
	let copied = $state(false);
	let copyTimeout: ReturnType<typeof setTimeout> | undefined;

	let scrollContainer: HTMLDivElement | undefined = $state();
	let isAtTop = $state(true);
	let isAtBottom = $state(true);
	let linesBelowCount = $state(0);

	let testExitStatus = $state<ProcessStatus | null>(null);

	const effectiveLines = $derived(fullLogLoaded ? displayLines : streamingLines);
	const isTestRun = $derived(processId !== null && processId.startsWith('test-'));
	const isTerminal = $derived(
		isTestRun ? testExitStatus !== null : process !== null && process.status !== 'running',
	);

	const exitMessage = $derived.by(() => {
		if (isTestRun) {
			if (testExitStatus === null || testExitStatus === 'running') {
				return null;
			}
			switch (testExitStatus) {
				case 'passed':
					return { text: 'Test passed (exit 0)', colorClass: 'text-status-success' };
				case 'failed':
					return { text: 'Test failed (non-zero)', colorClass: 'text-status-danger' };
				case 'timeout':
					return { text: 'Test timed out', colorClass: 'text-status-warning' };
				case 'stopped':
					return { text: 'Test stopped', colorClass: 'text-foreground-subtle' };
			}
		}
		if (process === null || process.status === 'running') {
			return null;
		}
		switch (process.status) {
			case 'passed':
				return { text: 'Process exited (0)', colorClass: 'text-status-success' };
			case 'failed':
				return { text: 'Process exited (non-zero)', colorClass: 'text-status-danger' };
			case 'timeout':
				return { text: 'Process timed out', colorClass: 'text-status-warning' };
			case 'stopped':
				return { text: 'Process killed', colorClass: 'text-foreground-subtle' };
		}
	});

	function handleScroll() {
		if (!scrollContainer) {
			return;
		}
		const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
		const threshold = 40;
		isAtTop = scrollTop <= threshold;
		isAtBottom = scrollHeight - scrollTop - clientHeight <= threshold;

		if (!isAtBottom) {
			autoScroll = false;
			const remainingPixels = scrollHeight - scrollTop - clientHeight;
			const estimatedLineHeightPx = 18;
			linesBelowCount = Math.max(0, Math.round(remainingPixels / estimatedLineHeightPx));
		} else {
			autoScroll = true;
			linesBelowCount = 0;
		}
	}

	function scrollToBottom() {
		if (scrollContainer) {
			scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' });
			autoScroll = true;
		}
	}

	function scrollToTop() {
		if (scrollContainer) {
			scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
			autoScroll = false;
		}
	}

	$effect(() => {
		if (autoScroll && effectiveLines.length > 0 && scrollContainer) {
			void tick().then(() => {
				scrollContainer?.scrollTo({ top: scrollContainer.scrollHeight });
			});
		}
	});

	$effect(() => {
		if (processId !== null) {
			fullLogLoaded = false;
			displayLines = [];
			autoScroll = true;
			copied = false;
			isAtTop = true;
			isAtBottom = true;
			linesBelowCount = 0;
			testExitStatus = null;
		}
	});

	let testExitUnlisten: UnlistenFn | null = null;

	$effect(() => {
		const currentId = processId;
		if (currentId === null || !currentId.startsWith('test-')) {
			testExitUnlisten?.();
			testExitUnlisten = null;
			return;
		}
		let cancelled = false;
		void listen<[string, ProcessStatus]>('process-exited', (event) => {
			const [exitProcessId, status] = event.payload;
			if (exitProcessId === currentId) {
				testExitStatus = status;
			}
		}).then((unlisten) => {
			if (cancelled) {
				unlisten();
				return;
			}
			testExitUnlisten = unlisten;
		});
		return () => {
			cancelled = true;
			testExitUnlisten?.();
			testExitUnlisten = null;
		};
	});

	async function handleCopy() {
		const text = effectiveLines.map((l) => l.text).join('\n');
		try {
			await navigator.clipboard.writeText(text);
			copied = true;
			clearTimeout(copyTimeout);
			copyTimeout = setTimeout(() => {
				copied = false;
			}, 2000);
		} catch {
			// clipboard API may be unavailable
		}
	}

	async function handleLoadFullLog() {
		if (processId === null || loadingFullLog) {
			return;
		}
		loadingFullLog = true;
		try {
			const fullText = await processesCtx.getFullProcessLogs(processId);
			const lines = fullText.split('\n').filter((l) => l !== '');
			displayLines = lines.map((line) => {
				if (line.startsWith('[stderr] ')) {
					return { stream: 'stderr' as const, text: line.slice(9) };
				}
				return { stream: 'stdout' as const, text: line };
			});
			fullLogLoaded = true;
		} catch (error) {
			console.error('Failed to load full process logs:', error);
		} finally {
			loadingFullLog = false;
		}
	}

	function handleClose() {
		processesCtx.closeLogViewer();
	}

	onDestroy(() => {
		clearTimeout(copyTimeout);
	});
</script>

<Dialog.Root
	open={isOpen}
	onOpenChange={(open) => {
		if (open === false) {
			handleClose();
		}
	}}
>
	<Dialog.Content class="flex h-[85vh] w-[min(90vw,720px)] max-w-none flex-col overflow-hidden">
		<Dialog.Title class="sr-only">
			Process Log: {process?.name ?? 'Unknown'}
		</Dialog.Title>

		<!-- Title bar -->
		<div class="flex h-10 shrink-0 items-center gap-2 border-b border-border px-3">
			{#if process}
				<span class={cn('size-2 shrink-0 rounded-full', STATUS_DOT_CLASSES[process.status])}
				></span>
				<span class="truncate text-sm font-semibold">{process.name}</span>
				{#if process.port !== null}
					<ServerPortBadge port={process.port} />
				{/if}
			{:else if isTestRun}
				{@const dotClass =
					testExitStatus === null
						? STATUS_DOT_CLASSES.running
						: STATUS_DOT_CLASSES[testExitStatus]}
				<span class={cn('size-2 shrink-0 rounded-full', dotClass)}></span>
				<span class="truncate text-sm font-semibold">Test Run</span>
			{:else}
				<span class="text-sm text-foreground-muted">Process</span>
			{/if}
			<span class="flex-1"></span>
			<Button intent="ghost" size="icon-sm" onclick={handleClose} aria-label="Close">
				<XIcon data-icon="inline-start" />
			</Button>
		</div>

		<!-- Log body wrapper (relative for scroll pills) -->
		<div class="relative min-h-0 flex-1">
			<!-- Scroll-to-top pill -->
			{#if !isAtTop}
				<button
					type="button"
					class="absolute top-2 left-1/2 z-10 -translate-x-1/2 cursor-pointer rounded-full border border-border bg-surface px-3 py-1 text-xs text-foreground-muted shadow-md transition-opacity duration-3 hover:bg-surface-2 hover:text-foreground"
					onclick={scrollToTop}
				>
					<ArrowUpIcon class="inline-block size-3" />
					Scroll to top
				</button>
			{/if}

			<!-- Scrollable log body -->
			<div
				bind:this={scrollContainer}
				onscroll={handleScroll}
				class="h-full overflow-y-auto bg-surface-2"
			>
				{#if effectiveLines.length === 0 && !isTerminal}
					<!-- Empty state -->
					<div
						class="flex h-full flex-col items-center justify-center gap-2 text-foreground-muted"
					>
						<TerminalIcon class="size-8 animate-pulse opacity-40" />
						<span class="text-sm">Waiting for output...</span>
					</div>
				{:else}
					<div class="py-1">
						{#each effectiveLines as line, index (index)}
							<div
								class={cn(
									'px-3 py-0.5 font-mono text-[11.5px] leading-relaxed whitespace-pre-wrap',
									line.stream === 'stderr'
										? 'text-[oklch(0.72_0.135_15)]'
										: 'text-foreground',
								)}
							>
								{line.text}
							</div>
						{/each}
						{#if exitMessage}
							<div
								class={cn(
									'px-3 py-1 font-mono text-[11.5px] leading-relaxed italic',
									exitMessage.colorClass,
								)}
							>
								{exitMessage.text}
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Scroll-to-bottom pill -->
			{#if !isAtBottom}
				<button
					type="button"
					class="absolute bottom-2 left-1/2 z-10 -translate-x-1/2 cursor-pointer rounded-full border border-border bg-surface px-3 py-1 text-xs text-foreground-muted shadow-md transition-opacity duration-3 hover:bg-surface-2 hover:text-foreground"
					onclick={scrollToBottom}
				>
					+{linesBelowCount} lines
					<ArrowDownIcon class="inline-block size-3" />
				</button>
			{/if}
		</div>

		<!-- Footer toolbar -->
		<div class="flex h-9 shrink-0 items-center gap-2 border-t border-border px-3">
			<!-- Left: Load full log + line count -->
			<div class="flex items-center gap-2">
				{#if !isTestRun && !fullLogLoaded && effectiveLines.length > 0}
					<Button
						intent="secondary"
						size="sm"
						onclick={handleLoadFullLog}
						disabled={loadingFullLog}
					>
						{#if loadingFullLog}
							<LoaderCircleIcon class="animate-spin" data-icon="inline-start" />
						{:else}
							<DownloadIcon data-icon="inline-start" />
						{/if}
						Load full log
					</Button>
				{/if}
				<span class="text-xs text-foreground-muted">
					{effectiveLines.length.toLocaleString()} lines
				</span>
			</div>

			<span class="flex-1"></span>

			<!-- Right: Copy + Auto-scroll toggle -->
			<div class="flex items-center gap-1">
				<Button
					intent="secondary"
					size="sm"
					onclick={handleCopy}
					aria-label={copied ? 'Copied' : 'Copy log'}
				>
					{#if copied}
						<CheckIcon class="text-status-success" data-icon="inline-start" />
						Copied
					{:else}
						<CopyIcon data-icon="inline-start" />
						Copy
					{/if}
				</Button>
				<Button
					intent={autoScroll ? 'primary' : 'secondary'}
					size="sm"
					onclick={() => {
						autoScroll = !autoScroll;
						if (autoScroll) {
							scrollToBottom();
						}
					}}
					aria-label="Auto-scroll"
					aria-pressed={autoScroll}
				>
					<ArrowDownIcon data-icon="inline-start" />
					Auto-scroll
				</Button>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
