<script lang="ts">
	interface Props {
		onCreateDashboard: () => void;
	}

	let { onCreateDashboard }: Props = $props();
</script>

<div class="flex h-full items-center justify-center">
	<div
		class="flex max-w-sm flex-col items-center gap-4 rounded-lg border border-border bg-card p-8 text-center"
	>
		<div class="text-3xl text-muted-foreground/60">◆</div>
		<h2 class="text-lg font-semibold">Create your first dashboard</h2>
		<p class="text-sm text-muted-foreground">
			A <strong class="text-foreground">repo dashboard</strong> tracks issues for a single
			repository. A <strong class="text-foreground">portfolio dashboard</strong> groups multiple
			repos together.
		</p>
		<button
			onclick={onCreateDashboard}
			class="rounded bg-primary px-4 py-2 text-sm text-primary-foreground transition-colors hover:bg-primary/90"
		>
			Create Dashboard
		</button>
	</div>
</div>
