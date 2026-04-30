<script lang="ts">
	import { useKeyboardShortcuts, eventToBinding } from '$lib/modules/keyboard-shortcuts';
	import type { ShortcutCollision } from '$lib/modules/keyboard-shortcuts';
	import { Kbd } from '$lib/components/ui/kbd/index.js';

	const shortcutsCtx = useKeyboardShortcuts();

	let rebindingActionId = $state<string | null>(null);
	let pendingBinding = $state<string | null>(null);
	let collision = $state<ShortcutCollision | null>(null);

	function startRebind(actionId: string) {
		rebindingActionId = actionId;
		pendingBinding = null;
		collision = null;
	}

	function cancelRebind() {
		rebindingActionId = null;
		pendingBinding = null;
		collision = null;
	}

	function handleRebindKeydown(event: KeyboardEvent) {
		event.preventDefault();
		event.stopPropagation();

		if (event.key === 'Escape') {
			cancelRebind();
			return;
		}

		const binding = eventToBinding(event);
		if (binding === null) {
			return;
		}

		pendingBinding = binding;
		if (rebindingActionId !== null) {
			collision = shortcutsCtx.checkCollision(rebindingActionId, binding);
		}
	}

	async function confirmRebind() {
		if (rebindingActionId === null || pendingBinding === null) {
			return;
		}
		await shortcutsCtx.rebind(rebindingActionId, pendingBinding);
		cancelRebind();
	}

	async function resetToDefault(actionId: string) {
		await shortcutsCtx.resetBinding(actionId);
	}

	$effect(() => {
		if (rebindingActionId !== null) {
			const handler = (event: KeyboardEvent) => {
				handleRebindKeydown(event);
			};
			window.addEventListener('keydown', handler, { capture: true });
			return () => {
				window.removeEventListener('keydown', handler, { capture: true });
			};
		}
	});
</script>

<section class="space-y-4">
	<h2 class="text-lg font-medium">Keyboard Shortcuts</h2>
	<p class="text-sm text-muted-foreground">
		Customize keyboard shortcuts. Click a binding to change it.
	</p>

	{#if shortcutsCtx.allBindings.length === 0}
		<p class="text-sm text-muted-foreground italic">No shortcuts registered yet.</p>
	{:else}
		<div class="space-y-2">
			{#each shortcutsCtx.allBindings as shortcutBinding (shortcutBinding.actionId)}
				<div
					class="flex items-center justify-between rounded border border-border bg-muted/50 px-3 py-2"
				>
					<span class="text-sm">{shortcutBinding.label}</span>

					<div class="flex items-center gap-2">
						{#if rebindingActionId === shortcutBinding.actionId}
							<div class="flex items-center gap-2">
								{#if pendingBinding}
									<Kbd>{pendingBinding}</Kbd>
									{#if collision}
										<span class="text-xs text-destructive">
											Conflicts with {collision.existingLabel}
										</span>
									{/if}
									<button
										type="button"
										onclick={confirmRebind}
										disabled={collision !== null}
										class="rounded bg-primary px-2 py-0.5 text-xs text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
									>
										Confirm
									</button>
								{:else}
									<span
										class="animate-pulse rounded border border-dashed border-ring px-3 py-1 text-xs text-muted-foreground"
									>
										Press a key combo…
									</span>
								{/if}
								<button
									type="button"
									onclick={cancelRebind}
									class="text-xs text-muted-foreground hover:text-foreground"
								>
									Cancel
								</button>
							</div>
						{:else}
							<button
								type="button"
								onclick={() => startRebind(shortcutBinding.actionId)}
								class="cursor-pointer transition-opacity hover:opacity-70"
								title="Click to rebind"
							>
								<Kbd>{shortcutBinding.binding}</Kbd>
							</button>
							{#if shortcutBinding.isCustom}
								<button
									type="button"
									onclick={() => resetToDefault(shortcutBinding.actionId)}
									class="text-xs text-muted-foreground hover:text-foreground"
									title="Reset to default"
								>
									Reset
								</button>
							{/if}
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</section>
