<script lang="ts">
	import { useCreationWizard } from '$lib/modules/creation-wizard';
	import { ColorPickerContent } from '$lib/components/derived/color-picker/index.js';

	interface Props {
		onConfirm: () => void;
	}

	let { onConfirm }: Props = $props();

	const wizard = useCreationWizard();
	const deps = wizard.dependencies;

	let pickerRef: ReturnType<typeof ColorPickerContent> | undefined = $state();

	export function handleArrow(key: string) {
		pickerRef?.handleArrowKey(key);
	}

	function handleSelect(color: string) {
		wizard.selectColor(color);
	}

	function handlePresetClick(color: string) {
		wizard.selectColor(color);
		onConfirm();
	}
</script>

<div class="flex flex-col gap-3">
	<ColorPickerContent
		bind:this={pickerRef}
		colors={deps.paletteColors}
		selectedColor={wizard.formData.selectedColor}
		usedColors={deps.usedColors}
		displayText="A"
		autofocus
		onSelect={handleSelect}
		onPresetClick={handlePresetClick}
	/>
</div>
