<script lang="ts">
	interface Props {
		size?: number;
		strokeWidth?: number;
		class?: string;
	}

	let { size = 24, strokeWidth = 2, class: className = '' }: Props = $props();
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width={strokeWidth}
	stroke-linecap="round"
	stroke-linejoin="round"
	class={className}
>
	<path d="M17.5 2.5L6 11l-3.5-2.5v7L6 13l11.5 8.5 4-1.5V4z" />
</svg>
