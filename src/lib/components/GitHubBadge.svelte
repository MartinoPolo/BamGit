<script lang="ts">
	import { openUrl } from '@tauri-apps/plugin-opener';

	/* eslint-disable @typescript-eslint/no-explicit-any */
	interface Props {
		icon: any;
		color: string;
		bg: string;
		label: string;
		number: number | null;
		url: string | null;
		prefix: string;
		disabled?: boolean;
	}

	let { icon: Icon, color, bg, label, number, url, prefix, disabled = false }: Props = $props();

	async function handle_click() {
		if (url && !disabled) {
			await openUrl(url);
		}
	}
</script>

<button
	onclick={handle_click}
	class="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition-opacity {bg} {color}"
	class:opacity-50={disabled}
	class:cursor-not-allowed={disabled}
	class:cursor-pointer={!disabled}
	class:hover:opacity-80={!disabled}
	title="{prefix} #{number} — {label}{disabled ? ' (offline)' : ''}"
	{disabled}
>
	<Icon size={12} />
	<span>#{number}</span>
</button>
