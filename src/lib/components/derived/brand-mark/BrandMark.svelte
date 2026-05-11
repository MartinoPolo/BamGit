<script lang="ts">
	interface Props {
		size?: number;
	}

	let { size = 22 }: Props = $props();
</script>

<svg style:width="{size}px" style:height="{size}px" viewBox="0 0 40 40" aria-hidden="true">
	<circle cx="20" cy="20" r="19" fill="var(--moss-700)" />
	<g transform="translate(20 26)">
		<rect x="-1.5" y="-4" width="3" height="6" fill="#7a4f2c" />
		<polygon points="0,-18 -8,-4 8,-4" fill="var(--moss-300)" />
		<polygon points="0,-18 0,-4 8,-4" fill="var(--moss-500)" />
		<polygon points="0,-14 -10,-2 10,-2" fill="var(--moss-300)" />
		<polygon points="0,-14 0,-2 10,-2" fill="var(--moss-500)" />
	</g>
</svg>
