<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import type { Issue } from '$lib/modules/issues';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import ColorPicker from './color-picker/ColorPicker.svelte';

	interface Props {
		issue: Issue | null;
		paletteColors?: string[];
		usedColors?: string[];
		isDarkMode?: boolean;
		onClose: () => void;
		onChangeColor: (issueId: string, newColor: string) => void;
	}

	let {
		issue,
		paletteColors = [],
		usedColors = [],
		isDarkMode = false,
		onClose,
		onChangeColor,
	}: Props = $props();

	const open = $derived(issue !== null);

	function handleSelect(color: string) {
		if (issue === null || !color) {
			return;
		}
		onChangeColor(issue.id, color);
		onClose();
	}

	function handleOpenChange(isOpen: boolean) {
		if (!isOpen) {
			onClose();
		}
	}
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
	<Dialog.Content class="max-w-xs">
		{#if issue}
			<Dialog.Header>
				<Dialog.Title>{m.issue_card_change_color()}</Dialog.Title>
			</Dialog.Header>

			<Dialog.Body>
				<ColorPicker
					variant="palette-hex-native"
					colors={paletteColors}
					selectedColor={issue.color ?? ''}
					{usedColors}
					{isDarkMode}
					onSelect={handleSelect}
				/>
			</Dialog.Body>
		{/if}
	</Dialog.Content>
</Dialog.Root>
