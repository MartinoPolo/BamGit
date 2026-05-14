<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { BADGE_DOT_OPTIONS, BADGE_FORMATS, BADGE_SIZES, BADGE_TONES, Badge } from './index.js';

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
</script>

<Story name="Default" args={{ tone: 'neutral' }}>
	{#snippet template(args: BadgeProps)}
		<Badge {...args}>Default</Badge>
	{/snippet}
</Story>

<Story name="All Tones">
	{#snippet template(args: BadgeProps)}
		<div class="flex flex-col gap-6 w-80">
			<div class="flex flex-col gap-3">
				<p class="text-sm font-medium text-foreground-muted">Tone x size</p>
				<div class="grid grid-cols-[7rem_repeat(2,minmax(0,1fr))] items-center gap-3">
					<div></div>
					{#each BADGE_SIZES as size (size)}
						<div class="text-center text-xs text-foreground-muted">{size}</div>
					{/each}
					{#each BADGE_TONES as tone (tone)}
						<div class="text-xs text-foreground-muted">{tone}</div>
						{#each BADGE_SIZES as size (size)}
							<div class="flex justify-center">
								<Badge {...args} {tone} {size}>{tone}</Badge>
							</div>
						{/each}
					{/each}
				</div>
			</div>

			<div class="flex flex-col gap-3">
				<p class="text-sm font-medium text-foreground-muted">Dot states</p>
				<div class="flex flex-wrap items-center gap-3">
					{#each BADGE_DOT_OPTIONS as dot (dot)}
						<Badge {...args} tone="success" {dot}>{dot}</Badge>
					{/each}
				</div>
			</div>
		</div>
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
