import { createContext } from 'svelte';
import { StateRaw } from '$lib/reactivity/state.svelte.js';
import { invoke, isTauri } from '$lib/tauri.js';
import { useBoard } from '$lib/modules/board/index.js';
import { useWindow } from '$lib/modules/window/index.js';
import { parseRawRequirements, serializeRawRequirements, formatTimestamp } from './parser.js';
import type { RawRequirementNote } from './types.js';

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

	const notes = new StateRaw<RawRequirementNote[]>([]);
	const open = new StateRaw(false);
	const loading = new StateRaw(false);
	const editingIndex = new StateRaw<number | null>(null);
	const saveError = new StateRaw<string | null>(null);

	function getLocalFolder(): string | null {
		return boardStore.activeDashboard?.local_folder ?? null;
	}

	async function load(): Promise<void> {
		const localFolder = getLocalFolder();
		if (localFolder === null || !isTauri()) {
			notes.current = [];
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
