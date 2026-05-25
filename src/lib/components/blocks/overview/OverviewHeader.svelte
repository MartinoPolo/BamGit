<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import * as m from '$lib/paraglide/messages.js';
	import { useSettings } from '$lib/modules/settings';
	import type { VersionControlContext } from '$lib/modules/version-control';
	import GitHubStatusCard from '$lib/components/blocks/github/GitHubStatusCard.svelte';
	import GitHubAuthWizard from '$lib/components/blocks/github-auth/GitHubAuthWizard.svelte';
	import ThemeToggle from '$lib/components/derived/theme-toggle/ThemeToggle.svelte';
	import GithubIcon from '$lib/components/derived/icons/GithubIcon.svelte';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import * as Popover from '$lib/components/shadcn/popover/index.js';
	import { Toggle } from '$lib/components/shadcn/toggle/index.js';
	import { SimpleTooltip } from '$lib/components/shadcn/tooltip/index.js';
	import { invoke } from '$lib/tauri.js';
	import { overviewActionButtonClass } from './overview_style.js';
	import ArchiveIcon from '@lucide/svelte/icons/archive';
	import SettingsIcon from '@lucide/svelte/icons/settings';

	interface Props {
		showArchived: boolean;
		onShowArchivedChange: (pressed: boolean) => void;
		versionControl: VersionControlContext;
	}

	let { showArchived, onShowArchivedChange, versionControl }: Props = $props();
	let authWizardOpen = $state(false);

	const settingsCtx = useSettings();

	function openSettings() {
		settingsCtx.setReturnUrl(page.url.pathname + page.url.search);
		void goto(resolve('/settings/general'));
	}
</script>

<header
	class="mb-8 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-6 max-md:grid-cols-1 max-md:items-start"
>
	<div class="grid gap-1">
		<h1 class="text-3xl leading-tight font-semibold text-foreground">{m.app_name()}</h1>
		<p class="text-sm text-muted-foreground">{m.overview_subtitle()}</p>
	</div>

	<div class="flex items-center gap-2">
		<ThemeToggle compact class={overviewActionButtonClass} />
		<SimpleTooltip text={m.nav_settings()} side="bottom">
			{#snippet asChild(props)}
				<button
					{...props}
					type="button"
					class={[
						'rounded-lg p-1.5 text-muted-foreground transition-colors',
						overviewActionButtonClass,
					]}
					aria-label={m.nav_settings()}
					onclick={openSettings}
				>
					<SettingsIcon size={14} />
				</button>
			{/snippet}
		</SimpleTooltip>
		<Toggle
			intent="outline"
			size="icon"
			pressed={showArchived}
			onPressedChange={onShowArchivedChange}
			aria-label="Toggle archived workspaces"
			class={overviewActionButtonClass}
		>
			<ArchiveIcon data-icon="inline-start" />
		</Toggle>
		<Popover.Root>
			<Popover.Trigger>
				{#snippet child({ props })}
					<Button
						{...props}
						intent="secondary"
						size="icon"
						aria-label="GitHub connection settings"
						class={overviewActionButtonClass}
					>
						<GithubIcon data-icon="inline-start" />
					</Button>
				{/snippet}
			</Popover.Trigger>
			<Popover.Content class="w-80" align="end">
				<GitHubStatusCard
					borderless
					authStatus={versionControl.authStatus}
					ghAvailability={versionControl.ghAvailability}
					onconnect={() => (authWizardOpen = true)}
					ondisconnect={async () => {
						await invoke('github_logout');
						await versionControl.checkAvailability();
					}}
				/>
			</Popover.Content>
		</Popover.Root>
	</div>
</header>

{#if authWizardOpen}
	<GitHubAuthWizard
		bind:open={authWizardOpen}
		onconnected={() => void versionControl.checkAvailability()}
	/>
{/if}
