<script lang="ts">
	import UserIcon from '@lucide/svelte/icons/user';

	interface Props {
		content: string;
	}

	let { content }: Props = $props();
</script>

<div class="flex justify-end">
	<div class="flex max-w-[75%] items-start gap-2">
		<div
			class="rounded-[14px_14px_4px_14px] bg-primary-soft px-3.5 py-2.5 text-[13px] leading-relaxed text-foreground"
		>
			{content}
		</div>
		<div
			class="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-foreground-muted"
		>
			<UserIcon class="size-3.5" />
		</div>
	</div>
</div>
