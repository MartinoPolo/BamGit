<script lang="ts">
	interface Props {
		on_create_dashboard: () => void;
	}

	let { on_create_dashboard }: Props = $props();
</script>

<div class="flex h-full items-center justify-center">
	<div
		class="flex max-w-sm flex-col items-center gap-4 rounded-lg border border-neutral-800 bg-neutral-900 p-8 text-center"
	>
		<div class="text-3xl text-neutral-600">◆</div>
		<h2 class="text-lg font-semibold">Create your first dashboard</h2>
		<p class="text-sm text-neutral-400">
			A <strong class="text-neutral-300">repo dashboard</strong> tracks issues for a single
			repository. A <strong class="text-neutral-300">portfolio dashboard</strong> groups multiple
			repos together.
		</p>
		<button
			onclick={on_create_dashboard}
			class="rounded bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-500"
		>
			Create Dashboard
		</button>
	</div>
</div>
