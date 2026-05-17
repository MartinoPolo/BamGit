<script lang="ts">
	import { getLocale, setLocale, locales } from '$lib/paraglide/runtime.js';
	import { Tabs, Tab } from '$lib/components/shadcn/tabs/index.js';

	const LOCALE_LABELS: Record<string, string> = {
		en: 'English',
		cs: 'Čeština',
	};
</script>

<div class="space-y-8">
	<section class="space-y-4">
		<div>
			<h2 class="text-lg font-medium">Language</h2>
			<p class="mt-1 text-sm text-muted-foreground">
				Choose the display language for the app interface.
			</p>
		</div>
		<Tabs class="w-fit *:justify-center">
			{#each locales as locale (locale)}
				<Tab active={getLocale() === locale} onclick={() => setLocale(locale)}>
					{LOCALE_LABELS[locale] ?? locale}
				</Tab>
			{/each}
		</Tabs>
	</section>
</div>
