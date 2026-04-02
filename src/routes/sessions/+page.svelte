<script lang="ts">
	import type { Session, SessionEventPayload } from '$lib/types/session';
	import { spawn_session, terminate_session } from '$lib/tauri/session_commands';
	import { get_session_store } from '$lib/stores/sessions.svelte';
	import { listen, type UnlistenFn } from '@tauri-apps/api/event';
	import { onMount, onDestroy } from 'svelte';
	import SessionCard from '$lib/components/SessionCard.svelte';
	import SessionChatView from '$lib/components/SessionChatView.svelte';

	const store = get_session_store();

	let selected_session_id = $state<string | null>(null);
	let spawn_prompt = $state('');
	let spawn_working_directory = $state('');
	let spawning = $state(false);
	let unlisten_fn: UnlistenFn | null = null;

	// Derive live session from store so state updates are always reflected
	const selected_session = $derived(
		selected_session_id !== ''
			? (store.sessions.find((s) => s.id === selected_session_id) ?? null)
			: null,
	);

	onMount(async () => {
		await store.load_sessions();

		unlisten_fn = await listen<SessionEventPayload>('session-event', (event) => {
			store.handle_session_event(event.payload);
		});
	});

	onDestroy(() => {
		unlisten_fn?.();
	});

	async function handle_spawn() {
		if (!spawn_prompt.trim() || !spawn_working_directory.trim()) {
			return;
		}
		spawning = true;
		try {
			await spawn_session({
				prompt: spawn_prompt.trim(),
				working_directory: spawn_working_directory.trim(),
			});
			spawn_prompt = '';
			await store.refresh();
		} catch (err) {
			console.error('Failed to spawn session:', err);
		} finally {
			spawning = false;
		}
	}

	function handle_select(session: Session) {
		selected_session_id = session.id;
	}

	async function handle_terminate(session_id: string) {
		try {
			await terminate_session(session_id);
			await store.refresh();
		} catch (err) {
			console.error('Failed to terminate session:', err);
		}
	}

	function handle_back() {
		selected_session_id = null;
		store.refresh();
	}
</script>

{#if selected_session}
	<!-- Chat view for selected session -->
	<div class="flex h-full flex-col">
		<div class="flex items-center gap-3 border-b border-neutral-700 px-4 py-3">
			<button class="text-sm text-neutral-400 hover:text-neutral-200" onclick={handle_back}>
				&larr; Back
			</button>
			<h2 class="truncate text-sm font-medium text-neutral-200">
				{selected_session.original_intent ?? 'Session'}
			</h2>
		</div>
		<div class="flex-1">
			<SessionChatView session={selected_session} />
		</div>
	</div>
{:else}
	<!-- Session list -->
	<div class="space-y-4 p-4">
		<div class="flex items-center justify-between">
			<h1 class="text-xl font-semibold text-neutral-100">Sessions</h1>
		</div>

		<!-- Spawn form -->
		<div class="space-y-2 rounded-lg border border-neutral-700 bg-neutral-800/50 p-4">
			<h3 class="text-sm font-medium text-neutral-300">New Session</h3>
			<input
				type="text"
				class="w-full rounded-md border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-neutral-200 placeholder-neutral-500 focus:border-blue-500 focus:outline-none"
				placeholder="Working directory (e.g., C:\projects\my-app)"
				bind:value={spawn_working_directory}
			/>
			<div class="flex gap-2">
				<input
					type="text"
					class="flex-1 rounded-md border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-neutral-200 placeholder-neutral-500 focus:border-blue-500 focus:outline-none"
					placeholder="Prompt (e.g., Fix the login bug in auth.ts)"
					bind:value={spawn_prompt}
					onkeydown={(e) => {
						if (e.key === 'Enter') {
							handle_spawn();
						}
					}}
				/>
				<button
					class="shrink-0 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
					onclick={handle_spawn}
					disabled={spawning || !spawn_prompt.trim() || !spawn_working_directory.trim()}
				>
					{spawning ? 'Spawning...' : 'Spawn'}
				</button>
			</div>
		</div>

		<!-- Active sessions -->
		{#if store.active_sessions.length > 0}
			<div class="space-y-2">
				<h3 class="text-sm font-medium text-neutral-400">Active</h3>
				{#each store.active_sessions as session (session.id)}
					<SessionCard
						{session}
						on_click={handle_select}
						on_terminate={handle_terminate}
					/>
				{/each}
			</div>
		{/if}

		<!-- Finished sessions -->
		{#if store.finished_sessions.length > 0}
			<div class="space-y-2">
				<h3 class="text-sm font-medium text-neutral-400">Completed</h3>
				{#each store.finished_sessions as session (session.id)}
					<SessionCard
						{session}
						on_click={handle_select}
						on_terminate={handle_terminate}
					/>
				{/each}
			</div>
		{/if}

		<!-- Empty state -->
		{#if store.loading === false && store.sessions.length === 0}
			<div class="py-12 text-center">
				<p class="text-neutral-500">No sessions yet. Spawn one above to get started.</p>
			</div>
		{/if}

		{#if store.loading}
			<div class="py-12 text-center">
				<p class="text-neutral-500">Loading sessions...</p>
			</div>
		{/if}
	</div>
{/if}
