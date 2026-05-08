<script lang="ts">
	import type { WorkspaceCommand } from '$lib/types/generated';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import GripVerticalIcon from '@lucide/svelte/icons/grip-vertical';

	interface Props {
		command: WorkspaceCommand;
		onUpdate: (id: string, field: string, value: string | number | null) => void;
		onDelete: (id: string) => void;
	}

	let { command, onUpdate, onDelete }: Props = $props();

	const isServer = $derived(command.category === 'server');
</script>

<div class="group flex items-start gap-2 rounded-md border border-border bg-surface-1 p-3">
	<div
		class="mt-2 cursor-grab text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
	>
		<GripVerticalIcon size={14} />
	</div>

	<div class="flex flex-1 flex-col gap-2">
		<div class="flex gap-2">
			<div class="flex-1 space-y-1">
				<Label class="text-xs text-muted-foreground">Name</Label>
				<Input
					value={command.name}
					onchange={(e) => onUpdate(command.id, 'name', e.currentTarget.value)}
					placeholder="e.g. Dev Server"
					class="h-8 text-sm"
				/>
			</div>
			<div class="flex-[2] space-y-1">
				<Label class="text-xs text-muted-foreground">Command</Label>
				<Input
					value={command.command}
					onchange={(e) => onUpdate(command.id, 'command', e.currentTarget.value)}
					placeholder="e.g. pnpm dev"
					class="h-8 font-mono text-sm"
				/>
			</div>
		</div>

		{#if isServer}
			<div class="space-y-1">
				<Label class="text-xs text-muted-foreground">Port Pattern (regex)</Label>
				<Input
					value={command.port_pattern ?? ''}
					onchange={(e) => {
						const value = e.currentTarget.value.trim();
						onUpdate(command.id, 'port_pattern', value || null);
					}}
					placeholder="e.g. localhost:(\d+)"
					class="h-8 font-mono text-sm"
				/>
			</div>
		{:else}
			<div class="w-32 space-y-1">
				<Label class="text-xs text-muted-foreground">Expected Exit Code</Label>
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
	</div>

	<Button
		variant="ghost"
		size="icon-sm"
		class="mt-1 shrink-0 text-muted-foreground hover:text-destructive"
		onclick={() => onDelete(command.id)}
	>
		<TrashIcon size={14} />
	</Button>
</div>
