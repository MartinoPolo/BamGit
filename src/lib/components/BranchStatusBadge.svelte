<script lang="ts">
	import type { BranchStatus } from '$lib/types/generated';

	const BRANCH_STATUS_COLOR: Record<BranchStatus, string> = {
		active: 'bg-green-900/60 text-green-300',
		local: 'bg-blue-900/60 text-blue-300',
		'remote-gone': 'bg-orange-900/60 text-orange-300',
		deleted: 'bg-red-900/60 text-red-300 line-through',
		unknown: 'bg-muted text-muted-foreground',
	};

	const BRANCH_STATUS_TOOLTIP: Record<BranchStatus, string> = {
		active: 'Branch exists locally and on remote',
		local: 'Branch exists locally only (not pushed)',
		'remote-gone': 'Remote branch deleted',
		deleted: 'Branch deleted',
		unknown: 'Branch status unknown',
	};

	const BRANCH_NAME_MAX_DISPLAY_LENGTH = 16;

	interface Props {
		branchName: string;
		status: BranchStatus;
	}

	let { branchName, status }: Props = $props();

	const truncatedName = $derived(
		branchName.length > BRANCH_NAME_MAX_DISPLAY_LENGTH
			? branchName.slice(0, BRANCH_NAME_MAX_DISPLAY_LENGTH) + '…'
			: branchName,
	);

	const colorClass = $derived(BRANCH_STATUS_COLOR[status]);
	const tooltip = $derived(`${BRANCH_STATUS_TOOLTIP[status]}: ${branchName}`);
</script>

<span
	class="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] leading-tight {colorClass}"
	title={tooltip}
>
	<span class="opacity-70">⎇</span>
	{truncatedName}
</span>
