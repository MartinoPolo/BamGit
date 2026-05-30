<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, waitFor, within } from 'storybook/test';
	import AchievementsDialog from './AchievementsDialog.svelte';
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
		title: 'Blocks/Usage/AchievementsDialog',
		component: AchievementsDialog,
		tags: ['autodocs'],
	});

	const playDefaultDialog = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// Find the trigger button — shows "2/6" text
		const triggerButton = canvas.getByRole('button', { name: /2\/6/ });
		await expect(triggerButton).toBeInTheDocument();

		// Open dialog — use native click for bits-ui child-snippet trigger
		triggerButton.click();

		// Both Dialog.Description (sr-only) and visible div contain "2 of 6 unlocked"
		await waitFor(() => {
			const matches = canvas.getAllByText('2 of 6 unlocked');
			expect(matches.length).toBeGreaterThanOrEqual(1);
		});

		// Verify unlocked achievements have primary styling
		const firstSeed = canvas.getByText('First Seed').closest('div[class*="rounded-lg"]');
		await expect(firstSeed).toHaveClass(/bg-primary/);

		// Verify not-yet-unlocked have opacity
		const greenThumb = canvas.getByText('Green Thumb').closest('div[class*="rounded-lg"]');
		await expect(greenThumb).toHaveClass(/opacity-50/);

		// Close dialog — find close button (aria-label="Close")
		const closeButton = canvas.getByRole('button', { name: 'Close' });
		closeButton.click();

		// Verify dialog is closed
		await waitFor(() => {
			expect(canvas.queryByText('2 of 6 unlocked')).not.toBeInTheDocument();
		});
	};
</script>

<Story name="Default [play: open/close and states]" play={playDefaultDialog}>
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
