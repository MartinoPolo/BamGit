<script lang="ts">
	interface Props {
		size?: number;
		class?: string;
	}

	let { size = 24, class: className = '' }: Props = $props();
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="currentColor"
	class={className}
>
	<path
		d="M17.583.063a1.5 1.5 0 0 0-1.032.392 1 1 0 0 0-.077.07L10.2 8.044 6.667 5.25l-.1-.076a1 1 0 0 0-1.233.044l-1.98 1.8a1 1 0 0 0-.083.073.75.75 0 0 0 0 1.07L6.2 11.1v.003l.003.003L6.2 11.1v.003l-2.93 2.936a.75.75 0 0 0 0 1.07 1 1 0 0 0 .083.073l1.98 1.8a1 1 0 0 0 1.233.044l.1-.076 3.534-2.794 6.274 7.52a1 1 0 0 0 .077.07 1.5 1.5 0 0 0 1.032.39A1.5 1.5 0 0 0 19 21.75V2.25a1.5 1.5 0 0 0-1.417-1.5 1 1 0 0 0-.083-.006zM17.5 5.985v12.03L12.197 12z"
	/>
</svg>
