<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { Button } from '$lib/components/shadcn/button/index.js';

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
		<h2 class="text-lg font-semibold">{m.onboarding_title()}</h2>
		<p class="text-sm text-muted-foreground">
			A <strong class="text-foreground">repo dashboard</strong> tracks issues for a single repository.
		</p>
		<Button intent="primary" onclick={onCreateDashboard}>
			{m.onboarding_create()}
		</Button>
	</div>
</div>
