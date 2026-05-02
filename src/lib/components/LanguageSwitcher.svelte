<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { getLocale, setLocale, locales } from '$lib/paraglide/runtime.js';
	import GlobeIcon from '@lucide/svelte/icons/globe';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Tabs, Tab } from '$lib/components/ui/tabs/index.js';

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
	<Button
		variant="ghost"
		size="icon"
		class="w-full"
		onclick={cycleLocale}
		aria-label={m.lang_switcher()}
		title={LOCALE_LABELS[getLocale()] ?? getLocale()}
	>
		<GlobeIcon class="size-4" />
	</Button>
{:else}
	<Tabs class="w-full">
		{#each locales as locale (locale)}
			<Tab
				active={getLocale() === locale}
				onclick={() => setLocale(locale)}
				title={LOCALE_LABELS[locale] ?? locale}
			>
				<span>{LOCALE_LABELS[locale] ?? locale}</span>
			</Tab>
		{/each}
	</Tabs>
{/if}
