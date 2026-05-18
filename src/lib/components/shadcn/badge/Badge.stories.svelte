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
	import TagIcon from '@lucide/svelte/icons/tag';
</script>

<Story name="All Variants">
	{#snippet template(args: BadgeProps)}
		<div class="flex flex-col gap-8">
			{#each BADGE_STYLES as badgeStyle (badgeStyle)}
				<div class="flex flex-col gap-3">
					<p class="text-sm font-medium text-foreground-muted">{badgeStyle}</p>
					<div
						class="grid items-center gap-x-3 gap-y-2"
						style="grid-template-columns: 12rem repeat({BADGE_TONES.length}, minmax(0, 1fr))"
					>
						<div></div>
						{#each BADGE_TONES as tone (tone)}
							<div class="text-center text-xs text-foreground-muted">{tone}</div>
						{/each}
						{#each BADGE_SIZES as size (size)}
							{#each BADGE_FORMATS as format (format)}
								<div class="text-xs text-foreground-muted">{size} / {format}</div>
								{#each BADGE_TONES as tone (tone)}
									<div class="flex justify-center">
										<Badge {...args} {tone} {badgeStyle} {format} {size}
											>{tone}</Badge
										>
									</div>
								{/each}
								<div class="text-xs text-foreground-muted">
									{size} / {format} / icon
								</div>
								{#each BADGE_TONES as tone (tone)}
									<div class="flex justify-center">
										<Badge {...args} {tone} {badgeStyle} {format} {size}>
											{#snippet icon()}<TagIcon class="size-3" />{/snippet}
											{tone}
										</Badge>
									</div>
								{/each}
							{/each}
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/snippet}
</Story>

<Story name="Default">
	{#snippet template(args: BadgeProps)}
		<div class="flex flex-wrap items-center gap-3">
			{#each BADGE_TONES as tone (tone)}
				<Badge {tone} {...args}>{tone}</Badge>
			{/each}
		</div>
	{/snippet}
</Story>

<Story name="Dots">
	{#snippet template(args: BadgeProps)}
		<div class="flex flex-col gap-4">
			{#each BADGE_DOT_OPTIONS as dot (dot)}
				<div class="flex flex-col gap-2">
					<p class="text-sm font-medium text-foreground-muted">{dot}</p>
					<div class="flex flex-wrap gap-2">
						{#each BADGE_TONES as tone (tone)}
							<Badge {tone} {dot} {...args}>{tone}</Badge>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/snippet}
</Story>

<Story name="With Icon">
	{#snippet template(args: BadgeProps)}
		<div class="flex flex-wrap items-center gap-3">
			{#each BADGE_TONES as tone (tone)}
				<Badge {tone} {...args}>
					{#snippet icon()}<TagIcon class="size-3" />{/snippet}
					{tone}
				</Badge>
			{/each}
		</div>
	{/snippet}
</Story>

<Story name="Font">
	{#snippet template(args: BadgeProps)}
		<div class="flex flex-col gap-4">
			{#each BADGE_FORMATS as format (format)}
				<div class="flex flex-col gap-2">
					<p class="text-sm font-medium text-foreground-muted">{format}</p>
					<div class="flex flex-wrap gap-2">
						{#each BADGE_TONES as tone (tone)}
							<Badge {tone} {format} {...args}>{tone}</Badge>
						{/each}
					</div>
					<div class="flex flex-wrap gap-2">
						{#each BADGE_TONES as tone (tone)}
							<Badge {tone} {format} {...args}>
								{#snippet icon()}<TagIcon class="size-3" />{/snippet}
								{tone}
							</Badge>
						{/each}
					</div>
				</div>
			{/each}
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
