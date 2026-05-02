<script lang="ts">
	import { useCreationWizard } from '$lib/modules/creation-wizard';
	import { ColorPicker } from '$lib/components/color-picker/index.js';

	const wizard = useCreationWizard();

	const deps = wizard.dependencies;
</script>

<div class="flex flex-col gap-3">
	<ColorPicker
		colors={deps.paletteColors}
		selectedColor={wizard.formData.selectedColor}
		usedColors={deps.usedColors}
		isDarkMode={deps.isDarkMode}
		displayText="A"
		onSelect={(color) => {
			wizard.selectColor(color);
		}}
	/>
</div>
