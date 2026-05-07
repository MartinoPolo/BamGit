<script lang="ts">
	interface Props {
		src: string;
		imageNumber: number;
	}

	let { src, imageNumber }: Props = $props();
</script>

<figure class="my-1 inline-block">
	<img
		{src}
		alt="Image #{imageNumber}"
		class="max-h-64 rounded-lg border border-border object-contain"
	/>
	<figcaption class="mt-1 text-center font-mono text-[10px] font-semibold text-foreground-subtle">
		#{imageNumber}
	</figcaption>
</figure>
