<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import { setCreationWizardContext } from '$lib/modules/creation-wizard/creation_wizard.context.svelte.js';
	import { WIZARD_STEPS } from '$lib/modules/creation-wizard/types.js';
	import type { WizardDependencies, WizardStep } from '$lib/modules/creation-wizard/types.js';

	interface Props {
		initialStep?: WizardStep;
		openOnMount?: boolean;
		children?: Snippet;
	}

	let { initialStep, openOnMount = true, children }: Props = $props();

	const MOCK_DEPENDENCIES: WizardDependencies = {
		dashboardId: 'mock-dashboard-grovekeeper',
		paletteColors: [
			'#ef4444',
			'#f97316',
			'#eab308',
			'#22c55e',
			'#10b981',
			'#06b6d4',
			'#3b82f6',
			'#8b5cf6',
		],
		usedColors: ['#ef4444'],
		nextAvailableColor: '#f97316',
		localFolder: 'C:/_MP_projects/Grovekeeper',
		defaultBaseBranch: 'dev',
		githubRepo: { owner: 'MartinoPolo', repo: 'Grovekeeper' },
		assignedIssues: [],
	};

	const wizardContext = setCreationWizardContext();

	onMount(() => {
		if (!openOnMount) {
			return;
		}

		wizardContext.openWizard(MOCK_DEPENDENCIES);

		if (initialStep === undefined || initialStep === WIZARD_STEPS.GITHUB_SEARCH) {
			return;
		}

		// github-search -> issue-name
		wizardContext.skipGithubSearch();
		if (initialStep === WIZARD_STEPS.ISSUE_NAME) {
			return;
		}

		// issue-name -> worktree-choice (or color-selection if no worktree)
		wizardContext.confirmIssueName('Mock Issue Name', 'mock-issue-branch');
		if (initialStep === WIZARD_STEPS.WORKTREE_CHOICE) {
			return;
		}

		// worktree-choice -> color-selection
		wizardContext.selectWorktreeChoice(false);
	});
</script>

{@render children?.()}
