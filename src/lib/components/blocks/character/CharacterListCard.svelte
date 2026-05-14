<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { Badge } from '$lib/components/shadcn/badge/index.js';
	import { Switch } from '$lib/components/shadcn/switch/index.js';
	import * as DropdownMenu from '$lib/components/shadcn/dropdown-menu/index.js';
	import { getLanguageFlag } from '$lib/modules/character-packs';
	import type { CharacterPack } from '$lib/types/generated';
	import UserIcon from '@lucide/svelte/icons/user';
	import LockIcon from '@lucide/svelte/icons/lock';
	import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';

	interface Props {
		pack: CharacterPack;
		class?: string;
		onedit?: () => void;
		onduplicate?: () => void;
		onexport?: () => void;
		ondelete?: () => void;
		ontoggle?: (enabled: boolean) => void;
	}

	let {
		pack,
		class: className,
		onedit,
		onduplicate,
		onexport,
		ondelete,
		ontoggle,
	}: Props = $props();

	const flag = $derived(getLanguageFlag(pack.language));

	const statusTone = $derived.by(() => {
		if (!pack.is_complete) {
			return 'warning' as const;
		}
		if (pack.is_enabled) {
			return 'success' as const;
		}
		return 'neutral' as const;
	});

	const statusLabel = $derived.by(() => {
		if (!pack.is_complete) {
			return 'Incomplete';
		}
		if (pack.is_enabled) {
			return 'Active';
		}
		return 'Disabled';
	});
</script>

<div
	class={cn(
		'flex items-center gap-3 rounded-lg border border-border bg-surface p-3 transition-colors hover:bg-surface-2/50',
		className,
	)}
>
	<div
		class="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-2"
	>
		{#if pack.avatar_path}
			<img
				src={pack.avatar_path}
				alt="{pack.display_name} avatar"
				class="size-full object-cover"
			/>
		{:else}
			<UserIcon class="size-6 text-muted-foreground" />
		{/if}
	</div>

	<div class="min-w-0 flex-1">
		<div class="flex items-center gap-2">
			<span class="truncate text-sm font-medium">{pack.display_name}</span>
			{#if pack.is_bundled}
				<LockIcon class="size-3 shrink-0 text-muted-foreground" />
			{/if}
			{#if flag}
				<span class="shrink-0 text-sm">{flag}</span>
			{/if}
		</div>
		<div class="mt-0.5 flex items-center gap-2">
			<Badge tone={statusTone} size="compact" dot={pack.is_enabled ? 'pulsing' : undefined}>
				{statusLabel}
			</Badge>
		</div>
	</div>

	<div class="flex shrink-0 items-center gap-2">
		<Switch
			checked={pack.is_enabled}
			disabled={!pack.is_complete || pack.is_bundled}
			onCheckedChange={(checked) => ontoggle?.(checked)}
		/>

		{#if !pack.is_bundled}
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props })}
						<Button {...props} intent="ghost" size="sm" class="size-8 p-0">
							<EllipsisVerticalIcon data-icon="inline-start" />
						</Button>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="end">
					<DropdownMenu.Group>
						<DropdownMenu.Item onclick={onedit}>
							<PencilIcon class="size-4" />
							Edit
						</DropdownMenu.Item>
						<DropdownMenu.Item onclick={onduplicate}>
							<CopyIcon class="size-4" />
							Duplicate
						</DropdownMenu.Item>
						<DropdownMenu.Item onclick={onexport}>
							<DownloadIcon class="size-4" />
							Export
						</DropdownMenu.Item>
					</DropdownMenu.Group>
					<DropdownMenu.Separator />
					<DropdownMenu.Group>
						<DropdownMenu.Item class="text-destructive" onclick={ondelete}>
							<Trash2Icon class="size-4" />
							Delete
						</DropdownMenu.Item>
					</DropdownMenu.Group>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		{/if}
	</div>
</div>
