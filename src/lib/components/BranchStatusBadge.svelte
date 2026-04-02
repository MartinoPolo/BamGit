<script lang="ts">
	import type { BranchStatus } from '$lib/types/git_status';
	import {
		BRANCH_STATUS_COLOR,
		BRANCH_STATUS_TOOLTIP,
		BRANCH_NAME_MAX_DISPLAY_LENGTH,
	} from '$lib/types/git_status';

	interface Props {
		branch_name: string;
		status: BranchStatus;
	}

	let { branch_name, status }: Props = $props();

	const truncated_name = $derived(
		branch_name.length > BRANCH_NAME_MAX_DISPLAY_LENGTH
			? branch_name.slice(0, BRANCH_NAME_MAX_DISPLAY_LENGTH) + '…'
			: branch_name,
	);

	const color_class = $derived(BRANCH_STATUS_COLOR[status]);
	const tooltip = $derived(`${BRANCH_STATUS_TOOLTIP[status]}: ${branch_name}`);
</script>

<span
	class="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] leading-tight {color_class}"
	title={tooltip}
>
	<span class="opacity-70">⎇</span>
	{truncated_name}
</span>
