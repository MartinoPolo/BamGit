<script lang="ts">
	import type { WorkspaceCommand } from '$lib/types/generated';
	import { Input } from '$lib/components/shadcn/input/index.js';
	import { Select } from '$lib/components/shadcn/select/index.js';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { PORT_PATTERN_PRESETS } from './port_pattern_presets.js';
	import { useProcesses } from '$lib/modules/processes';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import GripVerticalIcon from '@lucide/svelte/icons/grip-vertical';
	import PlayIcon from '@lucide/svelte/icons/play';

	interface Props {
		command: WorkspaceCommand;
		dashboardId: string;
		onUpdate: (id: string, field: string, value: string | number | null) => void;
		onDelete: (id: string) => void;
	}

	let { command, dashboardId, onUpdate, onDelete }: Props = $props();

	const processesCtx = useProcesses();
	const isServer = $derived(command.category === 'server');
	let testRunning = $state(false);

	const selectedPresetId = $derived.by(() => {
		const currentPattern = command.port_pattern;
		if (currentPattern === null || currentPattern === '') {
			return 'custom';
		}
		const matched = PORT_PATTERN_PRESETS.find(
			(p) => p.regex !== null && p.regex === currentPattern,
		);
		return matched?.id ?? 'custom';
	});

	function handlePresetChange(presetId: string) {
		const preset = PORT_PATTERN_PRESETS.find((p) => p.id === presetId);
		if (preset === undefined) {
			return;
		}
		onUpdate(command.id, 'port_pattern', preset.regex);
	}

	async function handleTestCommand() {
		if (testRunning || command.command.trim() === '') {
			return;
		}
		testRunning = true;
		try {
			await processesCtx.testCommand(command.id, dashboardId);
		} finally {
			testRunning = false;
		}
	}
</script>

<div class="group flex items-start gap-2 rounded-md border border-border bg-surface-1 p-3">
	<div
		class="mt-2 cursor-grab text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
	>
		<GripVerticalIcon size={14} />
	</div>

	<div class="flex flex-1 flex-col gap-2">
		<div class="flex gap-2">
			<div class="flex flex-1 flex-col gap-1">
				<span class="text-xs text-muted-foreground">Name</span>
				<Input
					value={command.name}
					onchange={(e) => onUpdate(command.id, 'name', e.currentTarget.value)}
					placeholder="e.g. Dev Server"
					class="h-8 text-sm"
				/>
			</div>
			<div class="flex flex-[2] flex-col gap-1">
				<span class="text-xs text-muted-foreground">Command</span>
				<Input
					value={command.command}
					onchange={(e) => onUpdate(command.id, 'command', e.currentTarget.value)}
					placeholder="e.g. pnpm dev"
					class="h-8 font-mono text-sm"
				/>
			</div>
		</div>

		{#if isServer}
			<div class="flex flex-col gap-1">
				<span class="text-xs text-muted-foreground">Port Pattern (regex)</span>
				<div class="flex gap-2">
					<Select
						value={selectedPresetId}
						onchange={(e) => handlePresetChange(e.currentTarget.value)}
						class="h-8 w-44 shrink-0 text-sm"
					>
						{#each PORT_PATTERN_PRESETS as preset (preset.id)}
							<option value={preset.id}>
								{preset.label}{preset.recommended ? ' ✦' : ''}
							</option>
						{/each}
					</Select>
					<Input
						value={command.port_pattern ?? ''}
						onchange={(e) => {
							const value = e.currentTarget.value.trim();
							onUpdate(command.id, 'port_pattern', value === '' ? null : value);
						}}
						placeholder="e.g. localhost:(\d+)"
						class="h-8 flex-1 font-mono text-sm"
					/>
				</div>
			</div>
		{:else}
			<div class="flex w-32 flex-col gap-1">
				<span class="text-xs text-muted-foreground">Expected Exit Code</span>
				<Input
					type="number"
					value={String(command.expected_exit_code)}
					onchange={(e) =>
						onUpdate(
							command.id,
							'expected_exit_code',
							parseInt(e.currentTarget.value, 10) || 0,
						)}
					class="h-8 text-sm"
				/>
			</div>
		{/if}

		<div class="flex gap-2">
			<div class="flex w-28 flex-col gap-1">
				<span class="text-xs text-muted-foreground">Mode</span>
				<Select
					value={command.mode}
					onchange={(e) => onUpdate(command.id, 'mode', e.currentTarget.value)}
					class="h-8 text-sm"
				>
					<option value="headless">Headless</option>
					<option value="terminal">Terminal</option>
				</Select>
			</div>
			<div class="flex w-32 flex-col gap-1">
				<span class="text-xs text-muted-foreground">Restart Policy</span>
				<Select
					value={command.restart_policy}
					onchange={(e) => onUpdate(command.id, 'restart_policy', e.currentTarget.value)}
					class="h-8 text-sm"
				>
					<option value="never">Never</option>
					<option value="on_failure">On Failure</option>
					<option value="always">Always</option>
				</Select>
			</div>
			<div class="flex w-24 flex-col gap-1">
				<span class="text-xs text-muted-foreground">Timeout (s)</span>
				<Input
					type="number"
					value={command.timeout_seconds !== null ? String(command.timeout_seconds) : ''}
					onchange={(e) => {
						const raw = e.currentTarget.value.trim();
						onUpdate(
							command.id,
							'timeout_seconds',
							raw === '' ? null : parseInt(raw, 10),
						);
					}}
					placeholder={isServer ? '∞' : '30'}
					class="h-8 text-sm"
				/>
			</div>
		</div>

		{#if command.restart_policy !== 'never'}
			<div class="flex gap-2">
				<div class="flex w-28 flex-col gap-1">
					<span class="text-xs text-muted-foreground">Max Retries</span>
					<Input
						type="number"
						value={String(command.max_restart_count)}
						onchange={(e) =>
							onUpdate(
								command.id,
								'max_restart_count',
								Math.max(0, parseInt(e.currentTarget.value, 10) || 0),
							)}
						min="0"
						class="h-8 text-sm"
					/>
				</div>
				<div class="flex w-36 flex-col gap-1">
					<span class="text-xs text-muted-foreground">Backoff Base (ms)</span>
					<Input
						type="number"
						value={String(command.backoff_base_delay_ms)}
						onchange={(e) =>
							onUpdate(
								command.id,
								'backoff_base_delay_ms',
								parseInt(e.currentTarget.value, 10) || 100,
							)}
						min="100"
						class="h-8 text-sm"
					/>
				</div>
			</div>
		{/if}

		{#if command.mode === 'terminal'}
			<p class="text-[10px] text-muted-foreground">
				Terminal mode: opens in external terminal, no process tracking or badges.
			</p>
		{/if}
	</div>

	<div class="mt-1 flex shrink-0 flex-col gap-1">
		<Button
			intent="ghost"
			size="icon-sm"
			aria-label="Test command"
			class="text-muted-foreground hover:text-foreground"
			disabled={testRunning || command.command.trim() === ''}
			onclick={handleTestCommand}
		>
			<PlayIcon data-icon="inline-end" />
		</Button>
		<Button
			intent="ghost"
			size="icon-sm"
			aria-label="Delete command"
			class="text-muted-foreground hover:text-destructive"
			onclick={() => onDelete(command.id)}
		>
			<TrashIcon data-icon="inline-end" />
		</Button>
	</div>
</div>
