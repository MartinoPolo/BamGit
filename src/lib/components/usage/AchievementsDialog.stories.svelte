<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import AchievementsDialog from './AchievementsDialog.svelte';
	import ThemeDecorator from '$lib/storybook/ThemeDecorator.svelte';
	import type { Achievement } from '$lib/types/generated/index.js';

	const mockAchievements: Achievement[] = [
		{
			kind: 'first-seed',
			display_name: 'First Seed',
			description: 'Created your first issue',
			threshold: 1,
			progress: 1,
			unlocked_at: '2024-01-15T10:00:00Z',
		},
		{
			kind: 'created10-trees',
			display_name: 'Getting Started',
			description: 'Planted 10 trees',
			threshold: 10,
			progress: 10,
			unlocked_at: '2024-01-20T14:30:00Z',
		},
		{
			kind: 'created50-trees',
			display_name: 'Forest Builder',
			description: 'Planted 50 trees',
			threshold: 50,
			progress: 47,
			unlocked_at: null,
		},
		{
			kind: 'green-thumb',
			display_name: 'Green Thumb',
			description: 'Keep weekly cost under $5',
			threshold: 1,
			progress: 0,
			unlocked_at: null,
		},
		{
			kind: 'cache-master',
			display_name: 'Cache Master',
			description: 'Achieve 80% cache hit ratio',
			threshold: 1,
			progress: 0,
			unlocked_at: null,
		},
		{
			kind: 'one-shot-wonder',
			display_name: 'One-Shot Wonder',
			description: 'Complete 5 one-shot sessions in a row',
			threshold: 5,
			progress: 2,
			unlocked_at: null,
		},
	];

	const { Story } = defineMeta({
		title: 'Usage/AchievementsDialog',
		component: AchievementsDialog,
		// @ts-expect-error — Storybook decorator typing doesn't match Svelte 5 Component type
		decorators: [() => ThemeDecorator],
		tags: ['autodocs'],
	});
</script>

<Story name="Default">
	{#snippet template()}
		<div class="flex items-center justify-center p-8">
			<AchievementsDialog
				achievements={mockAchievements}
				unlockedCount={2}
				totalCount={mockAchievements.length}
			/>
		</div>
	{/snippet}
</Story>

<Story name="All Unlocked">
	{#snippet template()}
		<div class="flex items-center justify-center p-8">
			<AchievementsDialog
				achievements={mockAchievements.map((a) => ({
					...a,
					unlocked_at: '2024-01-15T10:00:00Z',
					progress: a.threshold,
				}))}
				unlockedCount={mockAchievements.length}
				totalCount={mockAchievements.length}
			/>
		</div>
	{/snippet}
</Story>

<Story name="None Unlocked">
	{#snippet template()}
		<div class="flex items-center justify-center p-8">
			<AchievementsDialog
				achievements={mockAchievements.map((a) => ({
					...a,
					unlocked_at: null,
					progress: 0,
				}))}
				unlockedCount={0}
				totalCount={mockAchievements.length}
			/>
		</div>
	{/snippet}
</Story>
