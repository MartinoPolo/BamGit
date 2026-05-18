<script lang="ts">
	import IssueCardAppearancePanel from '$lib/components/blocks/settings/IssueCardAppearancePanel.svelte';
	import { setIssueCardSettingsContext } from '$lib/components/blocks/issue-card/index.js';

	setIssueCardSettingsContext();
</script>

<h1 class="text-xl font-semibold">Issue Cards</h1>
<div class="mt-6">
	<IssueCardAppearancePanel />
</div>
