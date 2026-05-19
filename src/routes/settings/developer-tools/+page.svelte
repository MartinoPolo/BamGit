<script lang="ts">
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { invoke } from '$lib/tauri.js';

	let seedStatus = $state<'idle' | 'seeding' | 'deleting'>('idle');
	let seedMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	async function handleSeedDemo() {
		seedStatus = 'seeding';
		seedMessage = null;
		try {
			await invoke('seed_demo_workspace');
			seedMessage = { type: 'success', text: 'Demo workspace created successfully.' };
		} catch (err) {
			seedMessage = { type: 'error', text: String(err) };
		}
		seedStatus = 'idle';
	}

	async function handleDeleteDemo() {
		seedStatus = 'deleting';
		seedMessage = null;
		try {
			await invoke('delete_demo_workspace');
			seedMessage = { type: 'success', text: 'Demo workspace deleted.' };
		} catch (err) {
			seedMessage = { type: 'error', text: String(err) };
		}
		seedStatus = 'idle';
	}
</script>

{#if import.meta.env.DEV}
	<div class="flex flex-col gap-8">
		<section class="flex flex-col gap-4">
			<div>
				<h2 class="text-lg font-medium">Demo Workspace</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Seed a demo workspace with test data covering every tree stage, accessory, and
					blocking relationship. For development and visual testing only.
				</p>
			</div>

			{#if seedMessage}
				<p
					class="rounded px-3 py-2 text-sm {seedMessage.type === 'success'
						? 'bg-[color-mix(in_oklch,var(--status-success)_14%,transparent)] text-status-success'
						: 'bg-destructive/20 text-destructive'}"
				>
					{seedMessage.text}
				</p>
			{/if}

			<div class="flex flex-wrap gap-3">
				<Button
					intent="secondary"
					disabled={seedStatus !== 'idle'}
					onclick={handleSeedDemo}
				>
					{seedStatus === 'seeding' ? 'Seeding...' : 'Seed Demo Workspace'}
				</Button>
				<Button intent="danger" disabled={seedStatus !== 'idle'} onclick={handleDeleteDemo}>
					{seedStatus === 'deleting' ? 'Deleting...' : 'Delete Demo Workspace'}
				</Button>
			</div>
		</section>
	</div>
{:else}
	<div class="flex flex-col gap-4">
		<h2 class="text-lg font-medium">Developer Tools</h2>
		<p class="text-sm text-muted-foreground">
			Developer tools are only available in development builds.
		</p>
	</div>
{/if}
