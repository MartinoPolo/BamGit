import { createContext } from 'svelte';
import { StateRaw } from '$lib/reactivity/state.svelte.js';
import { invoke, isTauri } from '$lib/tauri.js';
import { useBoard } from '$lib/modules/board/index.js';
import { useWindow } from '$lib/modules/window/index.js';
import { useToasts } from '$lib/modules/toasts/index.js';
import { parseRawRequirements, serializeRawRequirements, formatTimestamp } from './parser.js';
import type { RawRequirementNote } from './types.js';

const MOCK_NOTES: RawRequirementNote[] = [
	{
		timestamp: '2026-05-01 09:15',
		content: 'Add keyboard shortcut for quick issue creation',
		processed: false,
	},
	{
		timestamp: '2026-05-01 14:30',
		content: 'Forest view should show dependency arrows between trees',
		processed: false,
	},
	{
		timestamp: '2026-05-02 10:00',
		content: 'Color picker needs a "recently used" section',
		processed: true,
	},
	{
		timestamp: '2026-05-03 08:45',
		content: 'Session cost tracking should aggregate by PRD',
		processed: false,
	},
	{
		timestamp: '2026-05-04 16:20',
		content: 'Add bulk archive for completed sub-issues',
		processed: false,
	},
	{
		timestamp: '2026-05-05 11:00',
		content: 'Dashboard overview should show active session count per workspace',
		processed: false,
	},
	{
		timestamp: '2026-05-06 09:30',
		content: 'Consider adding a notification when a session finishes in background',
		processed: false,
	},
];

// ─── Context ──────────────────────────────────────────────────────────────────

type RawRequirementsContext = ReturnType<typeof createRawRequirementsContext>;

const [useRawRequirements, setRawRequirementsInternal] = createContext<RawRequirementsContext>();
export { useRawRequirements };

export function setRawRequirementsContext() {
	const ctx = createRawRequirementsContext();
	setRawRequirementsInternal(ctx);
	return ctx;
}

// ─── Factory ──────────────────────────────────────────────────────────────────

function createRawRequirementsContext() {
	const boardStore = useBoard();
	const windowCtx = useWindow();
	const toasts = useToasts();

	const notes = new StateRaw<RawRequirementNote[]>([]);
	const open = new StateRaw(false);
	const loading = new StateRaw(false);
	const editingIndex = new StateRaw<number | null>(null);
	const saveError = new StateRaw<string | null>(null);

	function getLocalFolder(): string | null {
		return boardStore.activeDashboard?.local_folder ?? null;
	}

	async function load(): Promise<void> {
		if (loading.current) {
			return;
		}
		const localFolder = getLocalFolder();
		if (localFolder === null || !isTauri()) {
			if (!isTauri() && notes.current.length === 0) {
				notes.current = MOCK_NOTES;
			}
			return;
		}
		saveError.current = null;
		try {
			loading.current = true;
			const content = await invoke<string>('read_raw_requirements', {
				localFolder,
			});
			notes.current = parseRawRequirements(content);
		} catch (error) {
			console.error('Failed to load raw requirements:', error);
			notes.current = [];
		} finally {
			loading.current = false;
		}
	}

	async function save(): Promise<void> {
		const localFolder = getLocalFolder();
		if (localFolder === null || !isTauri()) {
			return;
		}
		try {
			const content = serializeRawRequirements(notes.current);
			await invoke('write_raw_requirements', { localFolder, content });
			saveError.current = null;
		} catch (error) {
			console.error('Failed to save raw requirements:', error);
			saveError.current = String(error);
			toasts.show({ tone: 'danger', title: 'Failed to save idea', body: String(error) });
		}
	}

	async function addNote(content: string): Promise<void> {
		const trimmed = content.trim();
		if (trimmed === '') {
			return;
		}
		const newNote: RawRequirementNote = {
			timestamp: formatTimestamp(),
			content: trimmed,
			processed: false,
		};
		notes.current = [...notes.current, newNote];
		await save();
	}

	async function updateNote(index: number, content: string): Promise<void> {
		const trimmed = content.trim();
		if (trimmed === '' || index < 0 || index >= notes.current.length) {
			return;
		}
		const updated = [...notes.current];
		updated[index] = { ...updated[index], content: trimmed };
		notes.current = updated;
		editingIndex.current = null;
		await save();
	}

	async function toggleProcessed(index: number): Promise<void> {
		if (index < 0 || index >= notes.current.length) {
			return;
		}
		const updated = [...notes.current];
		updated[index] = { ...updated[index], processed: !updated[index].processed };
		notes.current = updated;
		await save();
	}

	async function toggle(): Promise<void> {
		if (!windowCtx.isWorkspace) {
			return;
		}
		if (open.current) {
			close();
		} else {
			open.current = true;
			editingIndex.current = null;
			await load();
		}
	}

	function close(): void {
		open.current = false;
		editingIndex.current = null;
	}

	return {
		get notes() {
			return notes.current;
		},
		get open() {
			return open.current;
		},
		set open(value: boolean) {
			open.current = value;
			if (!value) {
				editingIndex.current = null;
			}
		},
		get loading() {
			return loading.current;
		},
		get editingIndex() {
			return editingIndex.current;
		},
		set editingIndex(value: number | null) {
			editingIndex.current = value;
		},
		get hasNotes() {
			return notes.current.length > 0;
		},
		get saveError() {
			return saveError.current;
		},

		toggle,
		close,
		load,
		addNote,
		updateNote,
		toggleProcessed,
	};
}
