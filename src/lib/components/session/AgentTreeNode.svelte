<script lang="ts">
	import type { SubAgent } from './sub_agent_types.js';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import CheckIcon from '@lucide/svelte/icons/check';
	import XIcon from '@lucide/svelte/icons/x';
	import AgentTreeNode from './AgentTreeNode.svelte';

	interface Props {
		agent: SubAgent;
		depth?: number;
		activeAgentId?: string | null;
		onSelect?: (agentId: string) => void;
	}

	let { agent, depth = 0, activeAgentId = null, onSelect }: Props = $props();

	let expanded = $state(true);

	const isActive = $derived(activeAgentId === agent.id);
	const hasChildren = $derived(agent.children.length > 0);
</script>

<div>
	<!-- Node row -->
	<button
		class="flex w-full cursor-pointer items-center gap-[5px] rounded-[5px] px-1.5 py-[5px] text-xs"
		class:bg-primary-soft={isActive}
		class:bg-surface-2={expanded && !isActive}
		style="margin-left: {depth * 14}px; border-left: 2px solid {isActive
			? 'var(--primary)'
			: 'transparent'}"
		onclick={() => onSelect?.(agent.id)}
		type="button"
	>
		{#if hasChildren}
			<span
				class="flex shrink-0 cursor-pointer items-center"
				role="button"
				tabindex="-1"
				onclick={(e) => {
					e.stopPropagation();
					expanded = !expanded;
				}}
				onkeydown={(e) => {
					if (e.key === 'Enter') {
						e.stopPropagation();
						expanded = !expanded;
					}
				}}
			>
				<ChevronRightIcon
					size={10}
					strokeWidth={2}
					class="text-foreground-subtle transition-transform duration-[120ms]"
					style="transform: {expanded ? 'rotate(90deg)' : 'none'}"
				/>
			</span>
		{:else}
			<span class="w-2.5 shrink-0"></span>
		{/if}

		<!-- Status indicator -->
		{#if agent.status === 'running'}
			<span
				class="inline-block size-[7px] shrink-0 rounded-full bg-status-success animate-[badge-pulse_1.8s_ease-in-out_infinite]"
			></span>
		{:else if agent.status === 'completed'}
			<CheckIcon size={11} strokeWidth={2.2} class="shrink-0 text-status-success" />
		{:else}
			<XIcon size={11} strokeWidth={2.2} class="shrink-0 text-status-danger" />
		{/if}

		<span
			class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left text-[11.5px] font-medium text-foreground"
		>
			{agent.name}
		</span>
	</button>

	<!-- Meta row -->
	<div
		class="flex items-center gap-2 px-1.5 pb-0.5 font-mono text-[10px] text-foreground-subtle"
		style="margin-left: {depth * 14 + 28}px"
	>
		<span>{agent.model}</span>
		<span>{agent.toolCount} tools</span>
		<span>{agent.duration}</span>
	</div>

	<!-- Children -->
	{#if expanded && hasChildren}
		{#each agent.children as child (child.id)}
			<AgentTreeNode agent={child} depth={depth + 1} {activeAgentId} {onSelect} />
		{/each}
	{/if}
</div>
