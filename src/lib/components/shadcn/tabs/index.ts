import Root from './Tabs.svelte';
import List from './tabs-list.svelte';
import Trigger from './tabs-trigger.svelte';
import Content from './tabs-content.svelte';

export { Root, Root as Tabs, List, Trigger, Trigger as Tab, Content };
export {
	tabsListVariants,
	tabsTriggerVariants,
	type TabsListProps,
	type TabsTriggerProps,
	type TabsContentProps,
} from './tabs-variants.js';
