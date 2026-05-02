<script lang="ts">
	import { useCreationWizard } from '$lib/modules/creation-wizard';
	import { ColorPicker } from '$lib/components/color-picker/index.js';

	const wizard = useCreationWizard();

	const deps = wizard.dependencies;
</script>

<div class="flex flex-col gap-3">
	<ColorPicker
		variant="palette-hex-native"
		colors={deps.paletteColors}
		selectedColor={wizard.formData.selectedColor}
		usedColors={deps.usedColors}
		isDarkMode={deps.isDarkMode}
		onSelect={(color) => {
			if (color === '') {
				wizard.selectColor(deps.nextAvailableColor);
			} else {
				wizard.selectColor(color);
			}
		}}
	/>
</div>
