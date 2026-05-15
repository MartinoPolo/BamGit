<script lang="ts">
	import * as Dialog from '$lib/components/shadcn/dialog/index.js';
	import * as DropdownMenu from '$lib/components/shadcn/dropdown-menu/index.js';
	import * as ContextMenu from '$lib/components/shadcn/context-menu/index.js';
	import * as Popover from '$lib/components/shadcn/popover/index.js';
	import * as Sheet from '$lib/components/shadcn/sheet/index.js';
	import { Select } from '$lib/components/shadcn/select/index.js';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { cn } from '$lib/utils.js';

	interface LogEntry {
		id: number;
		timestamp: string;
		eventType: string;
		targetTag: string;
		leaked: boolean;
	}

	const MAX_LOG_ENTRIES = 50;
	let logIdCounter = $state(0);
	let eventLog = $state<LogEntry[]>([]);
	let isFlashing = $state(false);
	let leakMessage = $state('');
	let leakMessageVisible = $state(false);
	let leakMessageTimer: ReturnType<typeof setTimeout> | null = null;

	function getTimestamp(): string {
		const now = new Date();
		const hh = String(now.getHours()).padStart(2, '0');
		const mm = String(now.getMinutes()).padStart(2, '0');
		const ss = String(now.getSeconds()).padStart(2, '0');
		return `${hh}:${mm}:${ss}`;
	}

	function addLogEntry(entry: Omit<LogEntry, 'id'>): void {
		const newEntry: LogEntry = { id: logIdCounter++, ...entry };
		eventLog = [newEntry, ...eventLog].slice(0, MAX_LOG_ENTRIES);
	}

	function handleLeakedEvent(event: KeyboardEvent | MouseEvent): void {
		const targetTag = (event.target as Element)?.tagName?.toLowerCase() ?? 'unknown';
		let eventType = event.type;
		let keyDetail = '';

		if (event instanceof KeyboardEvent) {
			keyDetail = ` (${event.key})`;
			eventType = 'keydown';
		}

		addLogEntry({
			timestamp: getTimestamp(),
			eventType,
			targetTag,
			leaked: true,
		});

		leakMessage = `EVENT LEAKED: ${eventType}${keyDetail}`;
		leakMessageVisible = true;
		isFlashing = true;

		if (leakMessageTimer !== null) {
			clearTimeout(leakMessageTimer);
		}
		leakMessageTimer = setTimeout(() => {
			leakMessageVisible = false;
			isFlashing = false;
			leakMessageTimer = null;
		}, 2000);
	}

	function clearLog(): void {
		eventLog = [];
	}
</script>

<div class="flex h-full min-h-screen bg-background text-foreground">
	<!-- Left: Test Area (70%) -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div
		class="relative flex w-[70%] flex-col gap-4 p-6 transition-colors duration-300"
		class:bg-status-danger={isFlashing}
		class:bg-surface-2={!isFlashing}
		onkeydown={handleLeakedEvent}
		onclick={handleLeakedEvent}
		oncontextmenu={handleLeakedEvent}
		role="group"
		aria-label="Event leak detection area"
		tabindex="0"
	>
		<!-- Instructions -->
		<div class="rounded-lg border border-border bg-surface p-3">
			<p class="text-sm text-foreground-muted">
				Open any overlay below, then press <kbd
					class="rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-xs"
					>Escape</kbd
				>. If the background flashes red, the event is leaking.
			</p>
		</div>

		<!-- Leak message -->
		{#if leakMessageVisible}
			<div
				class="absolute right-4 bottom-4 left-4 rounded-lg border border-status-danger bg-status-danger/20 px-4 py-3 text-center font-mono text-sm font-semibold text-status-danger"
			>
				{leakMessage}
			</div>
		{/if}

		<!-- Overlay Trigger Cards -->
		<div class="grid grid-cols-2 gap-4">
			<!-- Dialog -->
			<div class="rounded-lg border border-border bg-surface p-4">
				<h3 class="mb-3 text-sm font-semibold text-foreground">Dialog</h3>
				<Dialog.Root>
					<Dialog.Trigger>
						{#snippet child({ props })}
							<Button intent="secondary" size="sm" {...props}>Open Dialog</Button>
						{/snippet}
					</Dialog.Trigger>
					<Dialog.Content>
						<Dialog.Title>Dialog Test</Dialog.Title>
						<Dialog.Description>
							Press Escape to close. If the background behind flashes red, the event
							leaked past this dialog.
						</Dialog.Description>
						<Dialog.Body>
							<p class="text-sm text-foreground-muted">
								This dialog should consume the Escape key and prevent it from
								reaching the parent container.
							</p>
						</Dialog.Body>
						<Dialog.Footer>
							<Dialog.Close>
								{#snippet child({ props })}
									<Button intent="secondary" size="sm" {...props}>Close</Button>
								{/snippet}
							</Dialog.Close>
						</Dialog.Footer>
					</Dialog.Content>
				</Dialog.Root>
			</div>

			<!-- DropdownMenu -->
			<div class="rounded-lg border border-border bg-surface p-4">
				<h3 class="mb-3 text-sm font-semibold text-foreground">Dropdown Menu</h3>
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						<Button intent="secondary" size="sm">Open Dropdown</Button>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content>
						<DropdownMenu.Item>Action One</DropdownMenu.Item>
						<DropdownMenu.Item>Action Two</DropdownMenu.Item>
						<DropdownMenu.Item>Action Three</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>

			<!-- ContextMenu -->
			<div class="rounded-lg border border-border bg-surface p-4">
				<h3 class="mb-3 text-sm font-semibold text-foreground">Context Menu</h3>
				<ContextMenu.Root>
					<ContextMenu.Trigger>
						<div
							class="flex h-16 w-full cursor-context-menu items-center justify-center rounded-md border border-dashed border-border text-sm text-foreground-muted"
						>
							Right-click here
						</div>
					</ContextMenu.Trigger>
					<ContextMenu.Content>
						<ContextMenu.Item>Option One</ContextMenu.Item>
						<ContextMenu.Item>Option Two</ContextMenu.Item>
						<ContextMenu.Item>Option Three</ContextMenu.Item>
					</ContextMenu.Content>
				</ContextMenu.Root>
			</div>

			<!-- Popover -->
			<div class="rounded-lg border border-border bg-surface p-4">
				<h3 class="mb-3 text-sm font-semibold text-foreground">Popover</h3>
				<Popover.Root>
					<Popover.Trigger>
						{#snippet child({ props })}
							<Button intent="secondary" size="sm" {...props}>Open Popover</Button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content class="w-64">
						<p class="text-sm text-foreground-muted">
							Popover content. Press Escape to close. Check if event leaks to the
							parent.
						</p>
					</Popover.Content>
				</Popover.Root>
			</div>

			<!-- Select -->
			<div class="rounded-lg border border-border bg-surface p-4">
				<h3 class="mb-3 text-sm font-semibold text-foreground">Select</h3>
				<Select aria-label="Select option">
					<option value="">Choose an option…</option>
					<option value="one">Option One</option>
					<option value="two">Option Two</option>
					<option value="three">Option Three</option>
				</Select>
			</div>

			<!-- Sheet -->
			<div class="rounded-lg border border-border bg-surface p-4">
				<h3 class="mb-3 text-sm font-semibold text-foreground">Sheet</h3>
				<Sheet.Root>
					<Sheet.Trigger>
						{#snippet child({ props })}
							<Button intent="secondary" size="sm" {...props}>Open Sheet</Button>
						{/snippet}
					</Sheet.Trigger>
					<Sheet.Content side="right">
						<Sheet.Header>
							<Sheet.Title>Sheet Test</Sheet.Title>
							<Sheet.Description>
								Press Escape to close. Check if the event leaks to the parent area.
							</Sheet.Description>
						</Sheet.Header>
						<div class="p-4">
							<p class="text-sm text-foreground-muted">
								This sheet should consume the Escape keydown event and not let it
								propagate to the parent container.
							</p>
						</div>
						<Sheet.Footer>
							<Sheet.Close>
								{#snippet child({ props })}
									<Button intent="secondary" size="sm" {...props}>Close</Button>
								{/snippet}
							</Sheet.Close>
						</Sheet.Footer>
					</Sheet.Content>
				</Sheet.Root>
			</div>
		</div>
	</div>

	<!-- Right: Event Log (30%) -->
	<div class="flex w-[30%] flex-col border-l border-border bg-surface">
		<div class="flex items-center justify-between border-b border-border px-4 py-3">
			<h2 class="text-sm font-semibold text-foreground">Event Log</h2>
			<Button intent="ghost" size="sm" onclick={clearLog}>Clear Log</Button>
		</div>

		<div class="flex-1 overflow-y-auto p-2">
			{#if eventLog.length === 0}
				<p class="p-4 text-center text-xs text-foreground-subtle">
					No events captured yet. Interact with an overlay.
				</p>
			{:else}
				<div class="flex flex-col gap-1">
					{#each eventLog as entry (entry.id)}
						<div
							class={cn(
								'rounded-md border px-2.5 py-2 font-mono text-xs',
								entry.leaked
									? 'border-status-danger bg-status-danger/10 text-status-danger'
									: 'border-status-success bg-status-success/10 text-status-success',
							)}
						>
							<div class="flex items-center justify-between gap-2">
								<span class="text-foreground-subtle">{entry.timestamp}</span>
								<span class="font-semibold">{entry.eventType}</span>
							</div>
							<div class="mt-0.5 flex items-center justify-between gap-2">
								<span class="text-foreground-subtle"
									>target: &lt;{entry.targetTag}&gt;</span
								>
								<span class="font-medium">
									{entry.leaked ? 'LEAKED' : 'contained'}
								</span>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
