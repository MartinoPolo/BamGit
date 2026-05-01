import { createContext } from 'svelte';
import { StateRaw } from '$lib/reactivity/state.svelte.js';
import { Persisted, stringSerde } from '$lib/reactivity/persisted.svelte.js';
import { GLOW_COLORS } from './constants.js';

type ForestInteractionContext = ReturnType<typeof createForestInteractionContext>;

const [useForestInteraction, setForestInteractionInternal] =
	createContext<ForestInteractionContext>();
export { useForestInteraction };

export function setForestInteractionContext() {
	const ctx = createForestInteractionContext();
	setForestInteractionInternal(ctx);
	return ctx;
}

function isHexColor(value: unknown): value is string {
	return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);
}

function createForestInteractionContext() {
	const hoveredIssueId = new StateRaw<string | null>(null);
	const selectedIssueId = new StateRaw<string | null>(null);

	const hoverGlowColor = new Persisted<string>({
		key: 'grovekeeper_hover_glow_color',
		serde: stringSerde(isHexColor),
		defaultValue: GLOW_COLORS.yellow,
	});

	const selectedGlowColor = new Persisted<string>({
		key: 'grovekeeper_selected_glow_color',
		serde: stringSerde(isHexColor),
		defaultValue: GLOW_COLORS.blue,
	});

	function hoverIssue(issueId: string) {
		hoveredIssueId.current = issueId;
	}

	function unhover() {
		hoveredIssueId.current = null;
	}

	function selectIssue(issueId: string) {
		if (selectedIssueId.current === issueId) {
			selectedIssueId.current = null;
		} else {
			selectedIssueId.current = issueId;
		}
	}

	function deselect() {
		selectedIssueId.current = null;
	}

	return {
		get hoveredIssueId() {
			return hoveredIssueId.current;
		},
		get selectedIssueId() {
			return selectedIssueId.current;
		},
		get hoverGlowColor() {
			return hoverGlowColor.current;
		},
		set hoverGlowColor(value: string) {
			hoverGlowColor.current = value;
		},
		get selectedGlowColor() {
			return selectedGlowColor.current;
		},
		set selectedGlowColor(value: string) {
			selectedGlowColor.current = value;
		},
		hoverIssue,
		unhover,
		selectIssue,
		deselect,
	};
}
