<script lang="ts">
	import type { Session, DiscoveredSession } from '$lib/types/generated';
	import { useSessions } from '$lib/modules/sessions';
	import { useNotifications } from '$lib/modules/notifications';
	import { onMount } from 'svelte';
	import SessionCard from '$lib/components/SessionCard.svelte';
	import DiscoveredSessionCard from '$lib/components/DiscoveredSessionCard.svelte';
	import SessionChatView from '$lib/components/SessionChatView.svelte';

	const store = useSessions();
	const notificationStore = useNotifications();

	let selectedSessionId = $state<string | null>(null);
	let spawnPrompt = $state('');
	let spawnWorkingDirectory = $state('');
	let spawning = $state(false);

	// Derive live session from store so state updates are always reflected
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
			<button
				class="text-sm text-muted-foreground hover:text-foreground"
				onclick={handleBack}
			>
				&larr; Back
			</button>
			<h2 class="truncate text-sm font-medium text-foreground">
				{selectedSession.original_intent ?? 'Session'}
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
			<h1 class="text-xl font-semibold text-foreground">Sessions</h1>
		</div>

		<!-- Spawn form -->
		<div class="space-y-2 rounded-lg border border-border bg-muted/50 p-4">
			<h3 class="text-sm font-medium text-foreground">New Session</h3>
			<input
				type="text"
				class="w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:outline-none"
				placeholder="Working directory (e.g., C:\projects\my-app)"
				bind:value={spawnWorkingDirectory}
			/>
			<div class="flex gap-2">
				<input
					type="text"
					class="flex-1 rounded-md border border-input bg-muted px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:outline-none"
					placeholder="Prompt (e.g., Fix the login bug in auth.ts)"
					bind:value={spawnPrompt}
					onkeydown={(e) => {
						if (e.key === 'Enter') {
							handleSpawn();
						}
					}}
				/>
				<button
					class="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
					onclick={handleSpawn}
					disabled={spawning || !spawnPrompt.trim() || !spawnWorkingDirectory.trim()}
				>
					{spawning ? 'Spawning...' : 'Spawn'}
				</button>
			</div>
		</div>

		<!-- Discovered external sessions -->
		{#if store.discoveredSessions.length > 0}
			<div class="space-y-2">
				<h3 class="text-sm font-medium text-muted-foreground">
					External Sessions ({store.discoveredSessions.length})
				</h3>
				{#each store.discoveredSessions as session (session.id)}
					<DiscoveredSessionCard {session} onAdopt={handleAdopt} />
				{/each}
			</div>
		{/if}

		<!-- Active sessions -->
		{#if store.activeSessions.length > 0}
			<div class="space-y-2">
				<h3 class="text-sm font-medium text-muted-foreground">Active</h3>
				{#each store.activeSessions as session (session.id)}
					<SessionCard {session} onClick={handleSelect} onTerminate={handleTerminate} />
				{/each}
			</div>
		{/if}

		<!-- Finished sessions -->
		{#if store.finishedSessions.length > 0}
			<div class="space-y-2">
				<h3 class="text-sm font-medium text-muted-foreground">Completed</h3>
				{#each store.finishedSessions as session (session.id)}
					<SessionCard {session} onClick={handleSelect} onTerminate={handleTerminate} />
				{/each}
			</div>
		{/if}

		<!-- Empty state -->
		{#if store.loading === false && store.sessions.length === 0 && store.discoveredSessions.length === 0}
			<div class="py-12 text-center">
				<p class="text-muted-foreground">
					No sessions yet. Spawn one above to get started.
				</p>
			</div>
		{/if}

		{#if store.loading}
			<div class="py-12 text-center">
				<p class="text-muted-foreground">Loading sessions...</p>
			</div>
		{/if}
	</div>
{/if}
