<script lang="ts">
	import TrophyIcon from '@lucide/svelte/icons/trophy';
	import XIcon from '@lucide/svelte/icons/x';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import * as Dialog from '$lib/components/shadcn/dialog/index.js';
	import { cn } from '$lib/utils.js';
	import type { Achievement } from '$lib/types/generated/index.js';

	interface Props {
		achievements: Achievement[];
		unlockedCount: number;
		totalCount: number;
	}

	let { achievements, unlockedCount, totalCount }: Props = $props();
</script>

<Dialog.Root>
	<Dialog.Trigger>
		{#snippet child({ props })}
			<Button intent="secondary" size="sm" {...props}>
				<TrophyIcon data-icon="inline-start" />
				{unlockedCount}/{totalCount}
			</Button>
		{/snippet}
	</Dialog.Trigger>
	<Dialog.Content portalProps={{ disabled: true }}>
		<Dialog.Title class="sr-only">Achievements</Dialog.Title>
		<Dialog.Description class="sr-only">
			{unlockedCount} of {totalCount} unlocked
		</Dialog.Description>
		<Dialog.Header>
			<div>
				<div
					class="mb-0.5 text-(length:--text-xs) font-medium uppercase tracking-wider text-foreground-subtle"
				>
					Achievements
				</div>
				<div class="text-(length:--text-lg) font-semibold">
					{unlockedCount} of {totalCount} unlocked
				</div>
			</div>
			<Dialog.Close>
				{#snippet child({ props: closeProps })}
					<Button intent="ghost" size="icon-sm" {...closeProps}>
						<XIcon data-icon="inline-start" />
					</Button>
				{/snippet}
			</Dialog.Close>
		</Dialog.Header>
		<Dialog.Body>
			<div class="grid grid-cols-2 gap-3">
				{#each achievements as achievement (achievement.kind)}
					<div
						class={cn(
							'flex items-center gap-3 rounded-lg border p-3 transition-colors',
							achievement.unlocked_at !== null
								? 'border-primary/30 bg-primary/5'
								: 'opacity-50',
						)}
					>
						<div
							class={cn(
								'flex size-10 shrink-0 items-center justify-center rounded-lg text-lg',
								achievement.unlocked_at !== null ? 'bg-primary/10' : 'bg-muted',
							)}
						>
							<TrophyIcon
								class={cn(
									'size-5',
									achievement.unlocked_at !== null
										? 'text-primary'
										: 'text-muted-foreground',
								)}
							/>
						</div>
						<div class="min-w-0">
							<div class="truncate text-sm font-medium">
								{achievement.display_name}
							</div>
							<div class="text-xs text-muted-foreground">
								{achievement.description}
							</div>
							<div class="mt-1 h-1 overflow-hidden rounded-full bg-muted">
								<div
									class="h-full rounded-full bg-primary"
									style:width="{Math.min(
										(achievement.progress / achievement.threshold) * 100,
										100,
									)}%"
								></div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</Dialog.Body>
	</Dialog.Content>
</Dialog.Root>
