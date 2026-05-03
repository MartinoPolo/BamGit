<script lang="ts">
	import { getLocale, setLocale, locales } from '$lib/paraglide/runtime.js';
	import GlobeIcon from '@lucide/svelte/icons/globe';
	import SidebarCollapsedItem from './SidebarCollapsedItem.svelte';
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
	<SidebarCollapsedItem
		icon={GlobeIcon}
		label={LOCALE_LABELS[getLocale()] ?? getLocale()}
		onclick={cycleLocale}
	/>
{:else}
	<Tabs class="w-full [&>*]:flex-1 [&>*]:justify-center">
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
