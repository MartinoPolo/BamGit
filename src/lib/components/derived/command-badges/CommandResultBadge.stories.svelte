<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { CommandResultBadge, COMMAND_RESULT_STATES } from './index.js';
	import { BADGE_STYLES } from '$lib/components/shadcn/badge/index.js';

	const { Story } = defineMeta({
		title: 'Derived/CommandResultBadge',
		component: CommandResultBadge,
		tags: ['autodocs'],
		argTypes: {
			state: {
				control: 'select',
				options: [...COMMAND_RESULT_STATES],
			},
			badgeStyle: {
				control: 'select',
				options: [...BADGE_STYLES],
			},
		},
	});
</script>

<script lang="ts">
	import type { CommandResultBadgeProps } from './command_result_badge_types.js';
	import type { CommandResultState } from './command_result_badge_types.js';

	let animationState = $state<CommandResultState>('running');
	let animationInterval = $state<ReturnType<typeof setInterval> | null>(null);

	function startAnimation() {
		stopAnimation();
		const sequence: CommandResultState[] = [
			'running',
			'passed',
			'running',
			'failed',
			'running',
			'timeout',
			'running',
			'stopped',
		];
		let index = 0;
		animationState = sequence[0];
		animationInterval = setInterval(() => {
			index = (index + 1) % sequence.length;
			animationState = sequence[index];
		}, 1500);
	}

	function stopAnimation() {
		if (animationInterval !== null) {
			clearInterval(animationInterval);
			animationInterval = null;
		}
	}

	let manualState = $state<CommandResultState>('running');
</script>

<Story name="All States">
	{#snippet template()}
		<div class="flex flex-wrap items-center gap-3">
			{#each COMMAND_RESULT_STATES as state (state)}
				<CommandResultBadge {state} commandName="check:all" />
			{/each}
		</div>
	{/snippet}
</Story>

<Story name="Bidirectional Animation">
	{#snippet template()}
		<div class="flex flex-col gap-6">
			<div class="flex flex-col gap-2">
				<p class="text-xs font-medium text-foreground-muted">
					Auto-cycling through states (expand on running, collapse on completion)
				</p>
				<div class="flex items-center gap-3">
					<CommandResultBadge state={animationState} commandName="pnpm test" />
					<span class="text-xs text-foreground-muted">Current: {animationState}</span>
				</div>
				<div class="flex gap-2">
					<button
						type="button"
						class="rounded bg-surface-2 px-2 py-1 text-xs hover:bg-surface-3"
						onclick={startAnimation}
					>
						Start cycle
					</button>
					<button
						type="button"
						class="rounded bg-surface-2 px-2 py-1 text-xs hover:bg-surface-3"
						onclick={stopAnimation}
					>
						Stop
					</button>
				</div>
			</div>

			<div class="flex flex-col gap-2">
				<p class="text-xs font-medium text-foreground-muted">
					Manual toggle — click to switch states
				</p>
				<div class="flex items-center gap-3">
					<CommandResultBadge state={manualState} commandName="check:all" />
					{#each COMMAND_RESULT_STATES as state (state)}
						<button
							type="button"
							class="rounded px-2 py-1 text-xs {manualState === state
								? 'bg-primary text-primary-foreground'
								: 'bg-surface-2 hover:bg-surface-3'}"
							onclick={() => (manualState = state)}
						>
							{state}
						</button>
					{/each}
				</div>
			</div>
		</div>
	{/snippet}
</Story>

<Story name="Stale Results">
	{#snippet template()}
		<div class="flex flex-wrap items-center gap-3">
			<CommandResultBadge state="passed" commandName="test" isStale />
			<CommandResultBadge state="failed" commandName="lint" isStale />
			<CommandResultBadge state="timeout" commandName="build" isStale />
			<CommandResultBadge state="stopped" commandName="dev" isStale />
			<CommandResultBadge state="passed" commandName="test" isStale={false} />
		</div>
	{/snippet}
</Story>

<Story name="Badge Styles">
	{#snippet template()}
		<div class="flex flex-col gap-4">
			{#each BADGE_STYLES as style (style)}
				<div class="flex flex-col gap-2">
					<p class="text-xs font-medium text-foreground-muted">{style}</p>
					<div class="flex flex-wrap items-center gap-3">
						{#each COMMAND_RESULT_STATES as state (state)}
							<CommandResultBadge {state} commandName="check" badgeStyle={style} />
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/snippet}
</Story>

<Story name="Interactive" args={{ state: 'running', commandName: 'pnpm test' }}>
	{#snippet template(args: CommandResultBadgeProps)}
		<CommandResultBadge {...args} />
	{/snippet}
</Story>
