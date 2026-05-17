<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { useBoard } from '$lib/modules/board';
	import { useVersionControl } from '$lib/modules/version-control';
	import { Input } from '$lib/components/shadcn/input/index.js';
	import { Label } from '$lib/components/shadcn/label/index.js';
	import GitHubStatusCard from '$lib/components/blocks/github/GitHubStatusCard.svelte';
	import GitHubAuthWizard from '$lib/components/blocks/github-auth/GitHubAuthWizard.svelte';
	import { invoke } from '$lib/tauri.js';

	const boardStore = useBoard();
	const versionControl = useVersionControl();

	let authWizardOpen = $state(false);
	let editUsername = $state(boardStore.username);
	let editInitials = $state(boardStore.userInitials);
</script>

<div class="space-y-8">
	<section class="space-y-4">
		<div>
			<h2 class="text-lg font-medium">{m.settings_user_title()}</h2>
			<p class="mt-1 text-sm text-muted-foreground">
				{m.settings_user_description()}
			</p>
		</div>
		<div class="flex flex-col gap-3 sm:flex-row sm:items-end">
			<div class="flex-1 space-y-1">
				<Label for="username-input">{m.settings_username_label()}</Label>
				<Input
					id="username-input"
					bind:value={editUsername}
					onchange={() => {
						boardStore.username = editUsername;
					}}
				/>
			</div>
			<div class="w-24 space-y-1">
				<Label for="initials-input">{m.settings_initials_label()}</Label>
				<Input
					id="initials-input"
					bind:value={editInitials}
					onchange={() => {
						boardStore.userInitials = editInitials;
					}}
					maxlength={3}
				/>
			</div>
		</div>
	</section>

	<section class="space-y-4">
		<div>
			<h2 class="text-lg font-medium">GitHub</h2>
			<p class="mt-1 text-sm text-muted-foreground">
				Connect your GitHub account to sync issues, pull requests, and branches.
			</p>
		</div>

		<GitHubStatusCard
			authStatus={versionControl.authStatus}
			ghAvailability={versionControl.ghAvailability}
			onconnect={() => (authWizardOpen = true)}
			ondisconnect={async () => {
				await invoke('github_logout');
				await versionControl.checkAvailability();
			}}
		/>

		{#if !versionControl.authStatus.status.startsWith('oauth') && versionControl.ghAvailability === 'available'}
			<p class="text-xs text-muted-foreground">
				Using the gh CLI for GitHub access. Connect via OAuth for a richer experience
				without the CLI dependency.
			</p>
		{/if}
	</section>

	<GitHubAuthWizard
		bind:open={authWizardOpen}
		onconnected={() => void versionControl.checkAvailability()}
	/>
</div>
