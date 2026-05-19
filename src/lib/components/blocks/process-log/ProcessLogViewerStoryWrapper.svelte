<script lang="ts">
	import { onMount } from 'svelte';
	import { setProcessesContext } from '$lib/modules/processes/index.js';
	import type { ProcessLogLine } from '$lib/modules/processes/processes.context.svelte.js';
	import ProcessLogViewer from './ProcessLogViewer.svelte';

	type Variant = 'streaming' | 'empty' | 'completed' | 'failed' | 'with-stderr';

	interface Props {
		variant?: Variant;
	}

	let { variant = 'streaming' }: Props = $props();

	const STREAMING_LINES: ProcessLogLine[] = [
		{ stream: 'stdout', text: '> grovekeeper@0.1.0 check:all' },
		{ stream: 'stdout', text: '> prettier --check . && oxlint .' },
		{ stream: 'stdout', text: '' },
		{ stream: 'stdout', text: 'Checking formatting...' },
		{ stream: 'stdout', text: '[info] Checking 142 files' },
		{ stream: 'stdout', text: '[info] src/lib/components/base/Button.svelte - ok' },
		{ stream: 'stdout', text: '[info] src/lib/components/base/Input.svelte - ok' },
		{ stream: 'stdout', text: '[info] src/lib/modules/issues/index.ts - ok' },
		{ stream: 'stdout', text: '[info] src/lib/modules/processes/index.ts - ok' },
		{ stream: 'stdout', text: 'All matched files use Prettier code style!' },
	];

	const WITH_STDERR_LINES: ProcessLogLine[] = [
		{ stream: 'stdout', text: '> pnpm check:all' },
		{ stream: 'stdout', text: 'Checking formatting...' },
		{ stream: 'stderr', text: 'Warning: src/lib/components/blocks/OldBlock.svelte' },
		{ stream: 'stderr', text: '  1:1  warning  File is unused  no-unused-files' },
		{ stream: 'stdout', text: 'Running type check...' },
		{ stream: 'stderr', text: 'error TS2345: Argument of type string is not assignable.' },
		{ stream: 'stdout', text: 'Found 1 error in src/lib/types/generated.ts' },
	];

	const COMPLETED_LINES: ProcessLogLine[] = [
		{ stream: 'stdout', text: '> pnpm check:all' },
		{ stream: 'stdout', text: 'Checking formatting... ok' },
		{ stream: 'stdout', text: 'Running oxlint... ok' },
		{ stream: 'stdout', text: 'Running type check... ok' },
		{ stream: 'stdout', text: '' },
		{ stream: 'stdout', text: 'All checks passed in 4.2s' },
	];

	const FAILED_LINES: ProcessLogLine[] = [
		{ stream: 'stdout', text: '> pnpm check:all' },
		{ stream: 'stdout', text: 'Checking formatting...' },
		{
			stream: 'stderr',
			text: "src/lib/components/blocks/NewBlock.svelte doesn't match format",
		},
		{ stream: 'stdout', text: '' },
		{ stream: 'stdout', text: 'Run `prettier --write .` to fix.' },
	];

	function getLinesForVariant(): ProcessLogLine[] {
		switch (variant) {
			case 'streaming':
				return STREAMING_LINES;
			case 'with-stderr':
				return WITH_STDERR_LINES;
			case 'completed':
				return COMPLETED_LINES;
			case 'failed':
				return FAILED_LINES;
			case 'empty':
				return [];
		}
	}

	// setProcessesContext() sets the Svelte context key and schedules loadProcesses + Tauri
	// listeners on mount. The tauri_mock intercepts all invoke() calls in browser/Storybook mode.
	// We use the returned publicApi to seed mock process + log lines after the context is set.
	const processesCtx = setProcessesContext();

	onMount(() => {
		const setup = async () => {
			// runCommand invokes 'run_workspace_command' — the mock returns a running process.
			await processesCtx.runCommand('cmd-check', 'issue-story-1');

			const seededProcess = processesCtx.processes[0] as
				| (typeof processesCtx.processes)[number]
				| undefined;
			if (seededProcess === undefined) {
				return;
			}

			const processId = seededProcess.process_id;
			const lines = getLinesForVariant();

			// Seed all log lines at once into the SvelteMap.
			processesCtx.logLines.set(processId, lines);

			if (variant === 'completed') {
				seededProcess.status = 'passed';
			} else if (variant === 'failed') {
				seededProcess.status = 'failed';
			}

			processesCtx.openLogViewer(processId);
		};

		void setup();
	});
</script>

<ProcessLogViewer />
