<script lang="ts">
	import { getLocale, setLocale, locales } from '$lib/paraglide/runtime.js';
	import GlobeIcon from '@lucide/svelte/icons/globe';
	import SidebarCollapsedItem from '$lib/components/derived/sidebar-collapsed-item/SidebarCollapsedItem.svelte';
	import { Tabs, Tab } from '$lib/components/shadcn/tabs/index.js';
	import { SimpleTooltip } from '$lib/components/shadcn/tooltip/index.js';

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
			<SimpleTooltip text={LOCALE_LABELS[locale] ?? locale}>
				<Tab active={getLocale() === locale} onclick={() => setLocale(locale)}>
					<span>{LOCALE_LABELS[locale] ?? locale}</span>
				</Tab>
			</SimpleTooltip>
		{/each}
	</Tabs>
{/if}
