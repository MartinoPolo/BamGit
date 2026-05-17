<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
</script>

<div class="space-y-8">
	<section class="space-y-4">
		<div>
			<h2 class="text-lg font-medium">AI Configuration</h2>
			<p class="mt-1 text-sm text-muted-foreground">
				AI configuration — skills, rules, MCP servers, and discovery sources — is managed in
				its own dedicated page.
			</p>
		</div>
		<Button intent="secondary" onclick={() => void goto(resolve('/ai-config'))}>
			<SparklesIcon data-icon="inline-start" />
			Open AI Configuration
		</Button>
	</section>
</div>
