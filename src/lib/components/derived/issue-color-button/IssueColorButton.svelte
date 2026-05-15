<script lang="ts">
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { getContrastTextColor } from '$lib/components/derived/color-picker/color_utils.js';
	import type { IssueColorButtonProps } from './issue_color_button_types.js';

	let {
		color = null,
		class: className,
		children,
		...restProps
	}: IssueColorButtonProps = $props();

	let inlineStyle = $derived.by(() => {
		if (color === null || color === undefined || color === '') {
			return '';
		}
		const textColor = getContrastTextColor(color);
		return `--issue-btn-bg: ${color}; --issue-btn-text: ${textColor}; --issue-btn-border: ${color};`;
	});
</script>

<Button
	intent="issue-color"
	class={className}
	style={inlineStyle !== '' ? inlineStyle : undefined}
	{...restProps}
>
	{@render children?.()}
</Button>
