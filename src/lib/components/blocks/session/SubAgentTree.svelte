<script lang="ts">
	import type { SubAgent } from './sub_agent_types.js';
	import AgentTreeNode from './AgentTreeNode.svelte';

	interface Props {
		agents: SubAgent[];
		activeAgentId?: string | null;
		onSelect?: (agentId: string) => void;
	}

	let { agents, activeAgentId = null, onSelect }: Props = $props();
</script>

<div class="flex flex-col gap-px">
	{#each agents as agent (agent.id)}
		<AgentTreeNode {agent} {activeAgentId} {onSelect} />
	{/each}
</div>
