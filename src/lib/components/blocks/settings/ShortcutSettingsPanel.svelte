<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { useKeyboardShortcuts, eventToBinding } from '$lib/modules/keyboard-shortcuts';
	import type { ShortcutCollision } from '$lib/modules/keyboard-shortcuts';
	import { Kbd } from '$lib/components/shadcn/kbd/index.js';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { WithTooltip } from '$lib/components/shadcn/tooltip/index.js';

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
	<h2 class="text-lg font-medium">{m.shortcuts_title()}</h2>
	<p class="text-sm text-muted-foreground">
		{m.shortcuts_description()}
	</p>

	{#if shortcutsCtx.allBindings.length === 0}
		<p class="text-sm text-muted-foreground italic">{m.shortcuts_empty()}</p>
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
											{m.shortcuts_conflicts_with({
												label: collision.existingLabel,
											})}
										</span>
									{/if}
									<Button
										intent="primary"
										size="sm"
										onclick={confirmRebind}
										disabled={collision !== null}
									>
										{m.shortcuts_confirm()}
									</Button>
								{:else}
									<span
										class="animate-pulse rounded border border-dashed border-ring px-3 py-1 text-xs text-muted-foreground"
									>
										{m.shortcuts_press_key_combo()}
									</span>
								{/if}
								<Button intent="ghost" size="sm" onclick={cancelRebind}>
									{m.shortcuts_cancel()}
								</Button>
							</div>
						{:else}
							<WithTooltip text={m.shortcuts_click_to_rebind()}>
								<Button
									intent="ghost"
									size="sm"
									onclick={() => startRebind(shortcutBinding.actionId)}
								>
									<Kbd>{shortcutBinding.binding}</Kbd>
								</Button>
							</WithTooltip>
							{#if shortcutBinding.isCustom}
								<WithTooltip text={m.shortcuts_reset_to_default()}>
									<Button
										intent="ghost"
										size="sm"
										onclick={() => resetToDefault(shortcutBinding.actionId)}
									>
										{m.shortcuts_reset()}
									</Button>
								</WithTooltip>
							{/if}
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</section>
