<script lang="ts">
	import type { Session } from '$lib/types/generated/Session.js';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import PaperclipIcon from '@lucide/svelte/icons/paperclip';
	import XIcon from '@lucide/svelte/icons/x';
	import * as Collapsible from '$lib/components/shadcn/collapsible/index.js';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { Textarea } from '$lib/components/shadcn/textarea/index.js';
	import { cn } from '$lib/utils.js';
	import SkillChipsRow from './SkillChipsRow.svelte';
	import SendStopButton from './SendStopButton.svelte';
	import { getProviderConfig } from './session_theme_utils.js';

	interface Props {
		session: Session;
		value?: string;
		disabled?: boolean;
		onSend?: () => void;
		onStop?: () => void;
		onKeydown?: (event: KeyboardEvent) => void;
	}

	let {
		session,
		value = $bindable(''),
		disabled = false,
		onSend,
		onStop,
		onKeydown,
	}: Props = $props();

	const isRunning = $derived(session.state === 'running');
	const canSend = $derived(value.trim().length > 0 && !disabled && !isRunning);
	const providerConfig = $derived(getProviderConfig(session.provider));

	let imageCount = $state(0);
	let showImages = $state(false);

	function handleChipClick(command: string) {
		value = command + ' ';
	}
</script>

<div class="pointer-events-none absolute bottom-4 left-1/2 z-15 w-full max-w-225 -translate-x-1/2">
	<div class="pointer-events-auto rounded-3.5 border border-border bg-surface shadow-lg">
		<!-- Image carousel -->
		{#if imageCount > 0}
			<Collapsible.Root bind:open={showImages}>
				<Collapsible.Trigger
					class={cn(
						'flex w-full cursor-pointer items-center gap-1 px-3 py-1',
						!showImages && 'border-b border-border',
					)}
				>
					<PaperclipIcon size={11} strokeWidth={1.8} class="text-foreground-subtle" />
					<span class="text-[11px] text-foreground-subtle">{imageCount} images</span>
					<ChevronDownIcon
						size={10}
						strokeWidth={2}
						class={cn(
							'text-foreground-subtle transition-transform',
							showImages && 'rotate-180',
						)}
					/>
				</Collapsible.Trigger>
				<Collapsible.Content>
					<div
						class="flex items-center gap-1.5 overflow-x-auto border-b border-border px-3 py-2"
					>
						{#each Array.from({ length: imageCount }, (_, idx) => idx) as i (i)}
							<div
								class="relative flex size-11 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-surface-3"
							>
								<span
									class="font-mono text-[10px] font-semibold text-foreground-muted"
								>
									#{i + 1}
								</span>
								<button
									class="absolute top-0.5 right-0.5 flex size-3.5 cursor-pointer items-center justify-center rounded-0.75 border-none bg-black/40 p-0 text-white"
									onclick={() => imageCount--}
								>
									<XIcon size={8} strokeWidth={2.5} />
								</button>
							</div>
						{/each}
						<Button intent="ghost" size="sm" class="shrink-0 px-2 text-[10px]">
							<PlusIcon strokeWidth={2} data-icon="inline-start" />
							Add
						</Button>
					</div>
				</Collapsible.Content>
			</Collapsible.Root>
		{/if}

		<!-- Skill chips -->
		<SkillChipsRow onChipClick={handleChipClick} />

		<!-- Textarea -->
		<div class="px-3 py-1">
			<Textarea
				bind:value
				placeholder="Message or /command…"
				class="min-h-12 max-h-[50vh] resize-none border-none bg-transparent p-0 text-[13px] leading-undefined shadow-none focus-visible:ring-0"
				rows={3}
				{disabled}
				onkeydown={onKeydown}
			/>
		</div>

		<!-- Bottom controls -->
		<div class="flex items-center gap-1.5 border-t border-border px-3 py-1.5">
			<!-- Left group -->
			<Button intent="ghost" size="sm" class="text-[11px]">
				<PlusIcon strokeWidth={2} data-icon="inline-start" />
				Attach
			</Button>
			<Button intent="ghost" size="sm" class="text-[11px]">Tools ▾</Button>

			<div class="flex-1"></div>

			<!-- Right group -->
			<Button intent="ghost" size="sm" class="font-mono text-[10.5px]">Local ▾</Button>
			<Button intent="secondary" size="sm" class="max-w-65 truncate font-mono text-[10.5px]">
				{providerConfig.name} · Opus 4.7 (1M) · High ▾
			</Button>
			<Button intent="secondary" size="sm" class="text-[10.5px]">Approve each ▾</Button>
			<SendStopButton {isRunning} disabled={!canSend} {onSend} {onStop} />
		</div>
	</div>
</div>
