<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';

	let { children } = $props();

	const navigation_items = [
		{ href: '/issues' as const, label: 'Issues' },
		{ href: '/sessions' as const, label: 'Sessions' },
		{ href: '/settings' as const, label: 'Settings' },
	];
</script>

<div class="flex h-screen flex-col bg-neutral-950 text-neutral-100">
	<nav class="flex items-center gap-1 border-b border-neutral-800 px-4 py-2">
		<span class="mr-4 text-sm font-bold tracking-wide text-neutral-400">BamGit</span>
		{#each navigation_items as item (item.href)}
			<a
				href={resolve(item.href)}
				class="rounded px-3 py-1.5 text-sm transition-colors {page.url.pathname.startsWith(
					item.href
				)
					? 'bg-neutral-800 text-white'
					: 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'}"
			>
				{item.label}
			</a>
		{/each}
	</nav>

	<main class="flex-1 overflow-auto p-4">
		{@render children()}
	</main>
</div>
