<script lang="ts">
	import TrophyIcon from '@lucide/svelte/icons/trophy';
	import LockIcon from '@lucide/svelte/icons/lock';
	import XIcon from '@lucide/svelte/icons/x';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import * as Dialog from '$lib/components/shadcn/dialog/index.js';
	import { cn } from '$lib/utils.js';
	import type { Achievement } from '$lib/types/generated/index.js';
	import { isLockedAchievement, getLockedAchievementTooltip } from './locked_achievements.js';

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
	<Dialog.Content portalProps={{ disabled: true }} onEscapeKeydown={(e) => e.stopPropagation()}>
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
					<Button intent="ghost" size="icon-sm" aria-label="Close" {...closeProps}>
						<XIcon data-icon="inline-start" />
					</Button>
				{/snippet}
			</Dialog.Close>
		</Dialog.Header>
		<Dialog.Body>
			<div class="grid grid-cols-2 gap-3">
				{#each achievements as achievement (achievement.kind)}
					{@const locked = isLockedAchievement(achievement.kind)}
					{@const unlocked = achievement.unlocked_at !== null}
					<div
						class={cn(
							'flex items-center gap-3 rounded-lg border p-3 transition-colors',
							unlocked
								? 'border-primary/30 bg-primary/5'
								: locked
									? 'opacity-30'
									: 'opacity-50',
						)}
						title={locked ? getLockedAchievementTooltip(achievement.kind) : undefined}
					>
						<div
							class={cn(
								'flex size-10 shrink-0 items-center justify-center rounded-lg text-lg',
								unlocked ? 'bg-primary/10' : 'bg-muted',
							)}
						>
							{#if locked}
								<LockIcon class="size-5 text-muted-foreground" />
							{:else}
								<TrophyIcon
									class={cn(
										'size-5',
										unlocked ? 'text-primary' : 'text-muted-foreground',
									)}
								/>
							{/if}
						</div>
						<div class="min-w-0">
							<div class="truncate text-sm font-medium">
								{achievement.display_name}
							</div>
							<div class="text-xs text-muted-foreground">
								{achievement.description}
							</div>
							{#if locked}
								<div class="mt-1 text-xs text-muted-foreground">Locked</div>
							{:else}
								<div class="mt-1 h-1 overflow-hidden rounded-full bg-muted">
									<div
										class="h-full rounded-full bg-primary"
										style:width="{Math.min(
											(achievement.progress / achievement.threshold) * 100,
											100,
										)}%"
									></div>
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</Dialog.Body>
	</Dialog.Content>
</Dialog.Root>
