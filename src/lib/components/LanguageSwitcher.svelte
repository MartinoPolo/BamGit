<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { getLocale, setLocale, locales } from '$lib/paraglide/runtime.js';
	import GlobeIcon from '@lucide/svelte/icons/globe';

	interface Props {
		collapsed?: boolean;
	}

	let { collapsed = false }: Props = $props();

	const LOCALE_LABELS: Record<string, string> = {
		en: 'English',
		cs: 'Čeština',
	};

	function cycleLocale() {
		const currentLocale = getLocale();
		const currentIndex = locales.indexOf(currentLocale);
		const nextLocale = locales[(currentIndex + 1) % locales.length];
		setLocale(nextLocale);
	}
</script>

{#if collapsed}
	<button
		onclick={cycleLocale}
		class="flex w-full items-center justify-center rounded p-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
		aria-label={m.lang_switcher()}
		title={LOCALE_LABELS[getLocale()] ?? getLocale()}
	>
		<GlobeIcon class="size-4" />
	</button>
{:else}
	<div class="flex items-center gap-1 rounded-md bg-secondary p-1">
		{#each locales as locale (locale)}
			<button
				onclick={() => setLocale(locale)}
				class="flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-1 text-xs transition-colors {getLocale() ===
				locale
					? 'bg-background text-foreground shadow-sm'
					: 'text-muted-foreground hover:text-foreground'}"
				title={LOCALE_LABELS[locale] ?? locale}
			>
				<span>{LOCALE_LABELS[locale] ?? locale}</span>
			</button>
		{/each}
	</div>
{/if}
