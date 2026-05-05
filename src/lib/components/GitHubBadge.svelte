<script lang="ts">
	import { openUrl } from '@tauri-apps/plugin-opener';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';

	/* eslint-disable @typescript-eslint/no-explicit-any */
	interface Props {
		icon: any;
		colorClass: string;
		label: string;
		number: number | null;
		url: string | null;
		prefix: string;
		disabled?: boolean;
	}

	let { icon: Icon, colorClass, label, number, url, prefix, disabled = false }: Props = $props();

	const tooltip = $derived(`${prefix} #${number} — ${label}${disabled ? ' (offline)' : ''}`);

	async function handleClick(event: MouseEvent) {
		event.stopPropagation();
		if (url !== null && !disabled) {
			await openUrl(url);
		}
	}
</script>

<Tooltip.Provider>
	<Tooltip.Root>
		<Tooltip.Trigger>
			{#snippet child({ props })}
				<button
					{...props}
					onclick={handleClick}
					class="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium transition-opacity {colorClass}"
					class:opacity-50={disabled}
					class:cursor-not-allowed={disabled}
					class:cursor-pointer={!disabled}
					class:hover:opacity-80={!disabled}
					{disabled}
				>
					<Icon size={12} />
					<span>#{number}</span>
				</button>
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content>{tooltip}</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>
