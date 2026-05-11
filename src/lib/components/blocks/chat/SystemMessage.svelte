<script lang="ts">
	interface Props {
		content: string;
	}

	let { content }: Props = $props();
</script>

<div class="py-1 text-center text-[11px] text-foreground-subtle opacity-70">
	{content}
</div>
