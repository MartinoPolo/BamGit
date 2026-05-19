<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import {
		BADGE_DOT_OPTIONS,
		BADGE_FORMATS,
		BADGE_SIZES,
		BADGE_STYLES,
		BADGE_TONES,
		Badge,
	} from './index.js';

	const { Story } = defineMeta({
		title: 'Base/Badge',
		component: Badge,
		tags: ['autodocs'],
		argTypes: {
			tone: {
				control: 'select',
				options: [...BADGE_TONES],
			},
			format: {
				control: 'select',
				options: [...BADGE_FORMATS],
			},
			size: {
				control: 'select',
				options: [...BADGE_SIZES],
			},
			badgeStyle: {
				control: 'select',
				options: [...BADGE_STYLES],
			},
			dot: {
				control: 'select',
				options: [undefined, ...BADGE_DOT_OPTIONS],
			},
		},
	});
</script>

<script lang="ts">
	import type { BadgeProps } from './badge-variants.js';
	import CheckIcon from '@lucide/svelte/icons/circle-check';
	import AlertIcon from '@lucide/svelte/icons/triangle-alert';
	import XIcon from '@lucide/svelte/icons/circle-x';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';

	let collapseDemoStates = $state<Record<string, boolean>>({
		success: false,
		danger: false,
		warning: false,
		info: false,
	});

	function toggleCollapse(tone: string) {
		collapseDemoStates[tone] = !collapseDemoStates[tone];
	}
</script>

<Story name="All Variants">
	{#snippet template(args: BadgeProps)}
		<div class="flex flex-col gap-6 w-96">
			{#each BADGE_FORMATS as format (format)}
				<div class="flex flex-col gap-3">
					<p class="text-sm font-medium text-foreground-muted">{format}</p>
					<div class="grid grid-cols-[7rem_repeat(2,minmax(0,1fr))] items-center gap-3">
						<div></div>
						{#each BADGE_SIZES as size (size)}
							<div class="text-center text-xs text-foreground-muted">{size}</div>
						{/each}
						{#each BADGE_TONES as tone (tone)}
							<div class="text-xs text-foreground-muted">{tone}</div>
							{#each BADGE_SIZES as size (size)}
								<div class="flex justify-center">
									<Badge {...args} {tone} {format} {size}>{tone}</Badge>
								</div>
							{/each}
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/snippet}
</Story>

<Story name="Default" args={{ tone: 'neutral' }}>
	{#snippet template(args: BadgeProps)}
		<Badge {...args}>Default</Badge>
	{/snippet}
</Story>

<Story name="With Static Dot">
	{#snippet template(args: BadgeProps)}
		<div class="flex flex-wrap items-center gap-3">
			<Badge tone="success" dot="static" {...args}>Active</Badge>
			<Badge tone="danger" dot="static" {...args}>Error</Badge>
			<Badge tone="info" dot="static" {...args}>Info</Badge>
		</div>
	{/snippet}
</Story>

<Story name="With Pulsing Dot">
	{#snippet template(args: BadgeProps)}
		<div class="flex flex-wrap items-center gap-3">
			<Badge tone="success" dot="pulsing" {...args}>Live</Badge>
			<Badge tone="danger" dot="pulsing" {...args}>Critical</Badge>
			<Badge tone="warning" dot="pulsing" {...args}>Pending</Badge>
		</div>
	{/snippet}
</Story>

<Story name="With Icon">
	{#snippet template(args: BadgeProps)}
		<div class="flex flex-wrap items-center gap-3">
			<Badge tone="success" {...args}>
				{#snippet icon()}<CheckIcon class="size-3" />{/snippet}
				Passed
			</Badge>
			<Badge tone="warning" {...args}>
				{#snippet icon()}<AlertIcon class="size-3" />{/snippet}
				Warning
			</Badge>
		</div>
	{/snippet}
</Story>

<Story name="Mono">
	{#snippet template(args: BadgeProps)}
		<div class="flex flex-wrap items-center gap-3">
			<Badge format="mono" {...args}>v2.1.0</Badge>
			<Badge format="mono" {...args}>GET</Badge>
			<Badge format="mono" {...args}>200</Badge>
		</div>
	{/snippet}
</Story>

<Story name="Collapsible">
	{#snippet template(args: BadgeProps)}
		<div class="flex flex-col gap-6">
			<p class="text-xs text-foreground-muted">
				Click badges to toggle collapse/expand animation
			</p>
			<div class="flex flex-wrap items-center gap-3">
				<button type="button" onclick={() => toggleCollapse('success')}>
					<Badge tone="success" collapsed={collapseDemoStates.success} {...args}>
						{#snippet icon()}<CheckIcon class="size-3" />{/snippet}
						Passed
					</Badge>
				</button>
				<button type="button" onclick={() => toggleCollapse('danger')}>
					<Badge tone="danger" collapsed={collapseDemoStates.danger} {...args}>
						{#snippet icon()}<XIcon class="size-3" />{/snippet}
						Failed
					</Badge>
				</button>
				<button type="button" onclick={() => toggleCollapse('warning')}>
					<Badge tone="warning" collapsed={collapseDemoStates.warning} {...args}>
						{#snippet icon()}<AlertIcon class="size-3" />{/snippet}
						Warning
					</Badge>
				</button>
				<button type="button" onclick={() => toggleCollapse('info')}>
					<Badge tone="info" collapsed={collapseDemoStates.info} {...args}>
						{#snippet icon()}<LoaderCircleIcon class="size-3 animate-spin" />{/snippet}
						Running
					</Badge>
				</button>
			</div>
			<div class="flex flex-col gap-2">
				<p class="text-xs font-medium text-foreground-muted">Always collapsed</p>
				<div class="flex flex-wrap items-center gap-3">
					<Badge tone="success" collapsed>
						{#snippet icon()}<CheckIcon class="size-3" />{/snippet}
						Passed
					</Badge>
					<Badge tone="danger" collapsed>
						{#snippet icon()}<XIcon class="size-3" />{/snippet}
						Failed
					</Badge>
					<Badge tone="warning" collapsed>
						{#snippet icon()}<AlertIcon class="size-3" />{/snippet}
						Warning
					</Badge>
				</div>
			</div>
			<div class="flex flex-col gap-2">
				<p class="text-xs font-medium text-foreground-muted">Always expanded</p>
				<div class="flex flex-wrap items-center gap-3">
					<Badge tone="success">
						{#snippet icon()}<CheckIcon class="size-3" />{/snippet}
						Passed
					</Badge>
					<Badge tone="danger">
						{#snippet icon()}<XIcon class="size-3" />{/snippet}
						Failed
					</Badge>
					<Badge tone="info">
						{#snippet icon()}<LoaderCircleIcon class="size-3 animate-spin" />{/snippet}
						Running
					</Badge>
				</div>
			</div>
		</div>
	{/snippet}
</Story>

<Story name="Badge Styles (A/B/C)">
	{#snippet template(args: BadgeProps)}
		<div class="flex flex-col gap-4">
			{#each BADGE_STYLES as style (style)}
				<div class="flex flex-col gap-2">
					<p class="text-sm font-medium text-foreground-muted">{style}</p>
					<div class="flex flex-wrap gap-2">
						{#each BADGE_TONES as tone (tone)}
							<Badge {...args} {tone} badgeStyle={style}>{tone}</Badge>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/snippet}
</Story>
