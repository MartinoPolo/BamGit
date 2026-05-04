<script lang="ts">
	import { useCreationWizard } from '$lib/modules/creation-wizard';
	import { ColorPickerContent } from '$lib/components/color-picker/index.js';

	const wizard = useCreationWizard();

	const deps = wizard.dependencies;
</script>

<div class="flex flex-col gap-3">
	<ColorPickerContent
		colors={deps.paletteColors}
		selectedColor={wizard.formData.selectedColor}
		usedColors={deps.usedColors}
		displayText="A"
		autofocus
		onSelect={(color) => {
			wizard.selectColor(color);
		}}
	/>
</div>
