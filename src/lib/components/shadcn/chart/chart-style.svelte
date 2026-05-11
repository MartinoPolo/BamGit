<script lang="ts">
	import { THEMES, type ChartConfig } from './chart-utils.js';

	let { id, config }: { id: string; config: ChartConfig } = $props();

	const colorConfig = $derived(
		config != null
			? Object.entries(config).filter(
					([, config]) => config.theme != null || config.color != null,
				)
			: null,
	);

	const themeContents = $derived.by(() => {
		if (colorConfig == null || colorConfig.length === 0) {
			return;
		}

		const themeContents = [];
		for (const [_theme, prefix] of Object.entries(THEMES)) {
			let content = `${prefix} [data-chart=${id}] {\n`;
			const color = colorConfig.map(([key, itemConfig]) => {
				const theme = _theme as keyof typeof itemConfig.theme;
				const color = itemConfig.theme?.[theme] ?? itemConfig.color;
				return color != null ? `\t--color-${key}: ${color};` : null;
			});

			content += color.join('\n') + '\n}';

			themeContents.push(content);
		}

		return themeContents.join('\n');
	});
</script>

{#if themeContents != null}
	{#key id}
		<svelte:element this={'style'}>
			{themeContents}
		</svelte:element>
	{/key}
{/if}
