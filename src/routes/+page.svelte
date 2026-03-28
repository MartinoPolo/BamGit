<script lang="ts">
	import { invoke } from '@tauri-apps/api/core';

	let name = $state('');
	let greet_msg = $state('');

	async function greet(event: Event) {
		event.preventDefault();
		// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
		greet_msg = await invoke('greet', { name });
	}
</script>

<main class="m-0 flex flex-col items-center pt-[10vh] text-center">
	<h1 class="text-center">Welcome to Tauri + Svelte</h1>

	<div class="flex justify-center">
		<a href="https://vitejs.dev" target="_blank" class="font-medium text-indigo-400 hover:text-indigo-500">
			<img src="/vite.svg" class="h-24 p-6 transition-[filter] duration-700 hover:drop-shadow-[0_0_2em_#747bff]" alt="Vite Logo" />
		</a>
		<a href="https://tauri.app" target="_blank" class="font-medium text-indigo-400 hover:text-indigo-500">
			<img src="/tauri.svg" class="h-24 p-6 transition-[filter] duration-700 hover:drop-shadow-[0_0_2em_#24c8db]" alt="Tauri Logo" />
		</a>
		<a href="https://kit.svelte.dev" target="_blank" class="font-medium text-indigo-400 hover:text-indigo-500">
			<img src="/svelte.svg" class="h-24 p-6 transition-[filter] duration-700 hover:drop-shadow-[0_0_2em_#ff3e00]" alt="SvelteKit Logo" />
		</a>
	</div>
	<p>Click on the Tauri, Vite, and SvelteKit logos to learn more.</p>

	<form class="flex justify-center" onsubmit={greet}>
		<input
			id="greet-input"
			class="mr-1 rounded-lg border border-transparent bg-white px-5 py-2.5 font-medium shadow-sm outline-none transition-colors dark:bg-neutral-900 dark:text-white"
			placeholder="Enter a name..."
			bind:value={name}
		/>
		<button
			type="submit"
			class="cursor-pointer rounded-lg border border-transparent bg-white px-5 py-2.5 font-medium shadow-sm outline-none transition-colors hover:border-blue-600 active:border-blue-600 active:bg-neutral-200 dark:bg-neutral-900 dark:text-white dark:active:bg-neutral-800"
		>
			Greet
		</button>
	</form>
	<p>{greet_msg}</p>
</main>
