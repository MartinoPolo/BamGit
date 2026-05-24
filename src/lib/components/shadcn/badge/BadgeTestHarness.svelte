<script lang="ts">
	import Badge from './Badge.svelte';
	import type { BadgeTone, BadgeStyle, BadgeDot } from './badge-variants.js';

	interface Props {
		tone?: BadgeTone;
		badgeStyle?: BadgeStyle;
		collapsed?: boolean;
		dot?: BadgeDot;
		text?: string;
		showIcon?: boolean;
	}

	let {
		tone = 'neutral',
		badgeStyle = 'outlined',
		collapsed = false,
		dot,
		text = '',
		showIcon = false,
	}: Props = $props();
</script>

<Badge {tone} {badgeStyle} {collapsed} {dot}>
	{#snippet icon()}
		{#if showIcon}
			<span data-testid="badge-icon">I</span>
		{/if}
	{/snippet}
	{#if text}
		{text}
	{/if}
</Badge>
