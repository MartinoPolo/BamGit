import Root from './Select.svelte';
import CustomRoot from './select-custom-root.svelte';
import CustomTrigger from './select-custom-trigger.svelte';
import CustomContent from './select-custom-content.svelte';
import CustomItem from './select-custom-item.svelte';
import CustomGroup from './select-custom-group.svelte';
import CustomGroupHeading from './select-custom-group-heading.svelte';
import CustomSeparator from './select-custom-separator.svelte';
import CustomPortal from './select-custom-portal.svelte';

export { Root, Root as Select };
export {
	SELECT_STATES,
	type SelectProps,
	type SelectState,
	selectVariants,
} from './select-variants.js';
export type { SelectProps as Props } from './select-variants.js';

// bits-ui based custom select components
export {
	CustomRoot,
	CustomTrigger,
	CustomContent,
	CustomItem,
	CustomGroup,
	CustomGroupHeading,
	CustomSeparator,
	CustomPortal,
	CustomRoot as SelectCustom,
	CustomTrigger as SelectCustomTrigger,
	CustomContent as SelectCustomContent,
	CustomItem as SelectCustomItem,
	CustomGroup as SelectCustomGroup,
	CustomGroupHeading as SelectCustomGroupHeading,
	CustomSeparator as SelectCustomSeparator,
	CustomPortal as SelectCustomPortal,
};
