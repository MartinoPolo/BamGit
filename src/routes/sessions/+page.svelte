<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import type { Session, DiscoveredSession } from '$lib/types/generated';
	import { useSessions } from '$lib/modules/sessions';
	import { useNotifications } from '$lib/modules/notifications';
	import { onMount } from 'svelte';
	import SessionCard from '$lib/components/SessionCard.svelte';
	import DiscoveredSessionCard from '$lib/components/DiscoveredSessionCard.svelte';
	import SessionChatView from '$lib/components/SessionChatView.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';

	const store = useSessions();
	const notificationStore = useNotifications();

	let selectedSessionId = $state<string | null>(null);
	let spawnPrompt = $state('');
	let spawnWorkingDirectory = $state('');
	let spawning = $state(false);

	const selectedSession = $derived(
		selectedSessionId !== null
			? (store.sessions.find((s) => s.id === selectedSessionId) ?? null)
			: null,
	);

	onMount(async () => {
		await store.loadSessions();
	});

	async function handleSpawn() {
		if (!spawnPrompt.trim() || !spawnWorkingDirectory.trim()) {
			return;
		}
		spawning = true;
		try {
			await store.spawnSession({
				prompt: spawnPrompt.trim(),
				working_directory: spawnWorkingDirectory.trim(),
			});
			spawnPrompt = '';
		} catch (err) {
			console.error('Failed to spawn session:', err);
		} finally {
			spawning = false;
		}
	}

	function handleSelect(session: Session) {
		selectedSessionId = session.id;
		notificationStore.clearPending(session.id);
	}

	async function handleTerminate(sessionId: string) {
		try {
			await store.terminateSession(sessionId);
			await store.refresh();
		} catch (err) {
			console.error('Failed to terminate session:', err);
		}
	}

	async function handleAdopt(discovered: DiscoveredSession) {
		try {
			await store.adoptSession({
				cli_session_id: discovered.session_id,
				working_directory: discovered.working_directory,
				original_intent: discovered.first_prompt,
				cost_usd: discovered.cost_usd > 0 ? discovered.cost_usd : null,
				token_count: discovered.token_count > 0 ? discovered.token_count : null,
			});
			store.removeDiscoveredSession(discovered.id);
			await store.refresh();
		} catch (err) {
			console.error('Failed to adopt session:', err);
		}
	}

	function handleBack() {
		selectedSessionId = null;
		store.refresh();
	}
</script>

{#if selectedSession}
	<!-- Chat view for selected session -->
	<div class="flex h-full flex-col">
		<div class="flex items-center gap-3 border-b border-border px-4 py-3">
			<Button variant="ghost" size="sm" onclick={handleBack}>
				{m.session_back()}
			</Button>
			<h2 class="truncate text-sm font-medium text-foreground">
				{selectedSession.original_intent ?? m.session_fallback_title()}
			</h2>
		</div>
		<div class="flex-1">
			<SessionChatView session={selectedSession} />
		</div>
	</div>
{:else}
	<!-- Session list -->
	<div class="space-y-4 p-4">
		<div class="flex items-center justify-between">
			<h1 class="text-xl font-semibold text-foreground">{m.session_title()}</h1>
		</div>

		<!-- Spawn form -->
		<div class="space-y-2 rounded-lg border border-border bg-muted/50 p-4">
			<h3 class="text-sm font-medium text-foreground">{m.session_new()}</h3>
			<Input
				placeholder={m.session_placeholder_working_dir()}
				bind:value={spawnWorkingDirectory}
			/>
			<div class="flex gap-2">
				<Input
					class="flex-1"
					placeholder={m.session_placeholder_prompt()}
					bind:value={spawnPrompt}
					onkeydown={(e) => {
						if (e.key === 'Enter') {
							handleSpawn();
						}
					}}
				/>
				<Button
					class="shrink-0"
					onclick={handleSpawn}
					disabled={spawning || !spawnPrompt.trim() || !spawnWorkingDirectory.trim()}
				>
					{spawning ? m.session_spawning() : m.session_spawn()}
				</Button>
			</div>
		</div>

		<!-- Discovered external sessions -->
		{#if store.discoveredSessions.length > 0}
			<div class="space-y-2">
				<h3 class="text-sm font-medium text-muted-foreground">
					{m.session_external({ count: store.discoveredSessions.length })}
				</h3>
				{#each store.discoveredSessions as session (session.id)}
					<DiscoveredSessionCard {session} onAdopt={handleAdopt} />
				{/each}
			</div>
		{/if}

		<!-- Active sessions -->
		{#if store.activeSessions.length > 0}
			<div class="space-y-2">
				<h3 class="text-sm font-medium text-muted-foreground">{m.session_active()}</h3>
				{#each store.activeSessions as session (session.id)}
					<SessionCard {session} onClick={handleSelect} onTerminate={handleTerminate} />
				{/each}
			</div>
		{/if}

		<!-- Finished sessions -->
		{#if store.finishedSessions.length > 0}
			<div class="space-y-2">
				<h3 class="text-sm font-medium text-muted-foreground">{m.session_completed()}</h3>
				{#each store.finishedSessions as session (session.id)}
					<SessionCard {session} onClick={handleSelect} onTerminate={handleTerminate} />
				{/each}
			</div>
		{/if}

		<!-- Empty state -->
		{#if store.loading === false && store.sessions.length === 0 && store.discoveredSessions.length === 0}
			<div class="py-12 text-center">
				<p class="text-muted-foreground">
					{m.session_empty()}
				</p>
			</div>
		{/if}

		{#if store.loading}
			<div class="py-12 text-center">
				<p class="text-muted-foreground">{m.loading_sessions()}</p>
			</div>
		{/if}
	</div>
{/if}
