<script lang="ts">
	import type { BranchStatus } from '$lib/types/git_status';
	import {
		BRANCH_STATUS_COLOR,
		BRANCH_STATUS_TOOLTIP,
		BRANCH_NAME_MAX_DISPLAY_LENGTH,
	} from '$lib/types/git_status';

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
