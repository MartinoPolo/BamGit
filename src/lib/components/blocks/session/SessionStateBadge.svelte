<script lang="ts">
	import type { SessionState } from '$lib/types/generated/SessionState.js';
	import { Badge } from '$lib/components/shadcn/badge/index.js';
	import { SESSION_BADGE_CONFIG } from './session_theme_utils.js';

	interface Props {
		state: SessionState;
	}

	let { state }: Props = $props();

	const config = $derived(SESSION_BADGE_CONFIG[state] ?? SESSION_BADGE_CONFIG.running);
</script>

<Badge tone={config.tone} dot={config.pulse ? 'pulsing' : 'static'}>
	{config.label}
</Badge>
