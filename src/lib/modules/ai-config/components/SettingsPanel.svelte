<script lang="ts">
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import { invoke } from '$lib/tauri.js';
	import { useAiConfig } from '../ai_config.context.svelte.js';
	import { SETTINGS_BY_PROVIDER, type SettingDefinition } from './settings_definitions.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { Select } from '$lib/components/ui/select/index.js';
	import type { SettingsScope } from '$lib/types/generated';

	type SettingsRecord = Record<string, unknown>;

	const aiConfig = useAiConfig();

	let scope = $state<SettingsScope>('user');
	let settings = $state<SettingsRecord>({});
	let loading = $state(false);
	let error = $state<string | null>(null);

	const definitions = $derived(SETTINGS_BY_PROVIDER[aiConfig.provider] ?? []);

	function getNested(record: SettingsRecord, dottedKey: string): unknown {
		const parts = dottedKey.split('.');
		let current: unknown = record;
		for (const part of parts) {
			if (current === null || typeof current !== 'object') {
				return undefined;
			}
			current = (current as SettingsRecord)[part];
		}
		return current;
	}

	function setNested(record: SettingsRecord, dottedKey: string, value: unknown): SettingsRecord {
		const parts = dottedKey.split('.');
		const next: SettingsRecord = { ...record };
		let cursor: SettingsRecord = next;
		for (let i = 0; i < parts.length - 1; i += 1) {
			const part = parts[i];
			const existing = cursor[part];
			const child =
				existing !== null && typeof existing === 'object'
					? { ...(existing as SettingsRecord) }
					: {};
			cursor[part] = child;
			cursor = child;
		}
		cursor[parts[parts.length - 1]] = value;
		return next;
	}

	function patchFromKey(dottedKey: string, value: unknown): SettingsRecord {
		return setNested({}, dottedKey, value);
	}

	async function load(): Promise<void> {
		loading = true;
		error = null;
		try {
			const result = await invoke<unknown>('read_provider_settings', {
				provider: aiConfig.provider,
				scope,
				workspaceRoot: aiConfig.workspaceRoot ?? null,
			});
			settings = (result ?? {}) as SettingsRecord;
		} catch (err) {
			error = String(err);
			settings = {};
		} finally {
			loading = false;
		}
	}

	let saveTimer: ReturnType<typeof setTimeout> | null = null;

	async function save(dottedKey: string, value: unknown): Promise<void> {
		settings = setNested(settings, dottedKey, value);
		if (saveTimer !== null) {
			clearTimeout(saveTimer);
		}
		const patch = patchFromKey(dottedKey, value);
		saveTimer = setTimeout(() => {
			void invoke('write_provider_settings', {
				provider: aiConfig.provider,
				scope,
				workspaceRoot: aiConfig.workspaceRoot ?? null,
				patch,
			}).catch((err: unknown) => {
				error = String(err);
			});
		}, 300);
	}

	function getValue(def: SettingDefinition): unknown {
		const value = getNested(settings, def.key);
		return value ?? def.default;
	}

	function valueAsString(value: unknown): string {
		if (value === null || value === undefined) {
			return '';
		}
		return String(value);
	}

	function valueAsBoolean(value: unknown): boolean {
		return value === true;
	}

	function valueAsNumber(value: unknown, fallback: number): number {
		if (typeof value === 'number') {
			return value;
		}
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : fallback;
	}

	$effect(() => {
		// re-load when provider or scope changes
		void aiConfig.provider;
		void scope;
		void load();
	});
</script>

<div class="flex flex-col gap-4">
	<div class="flex items-center gap-2">
		<span class="text-xs font-medium text-foreground-subtle">Scope</span>
		<div class="inline-flex rounded-md border border-border bg-surface-2 p-0.5">
			<Button
				variant={scope === 'user' ? 'secondary' : 'ghost'}
				size="sm"
				class="h-7 px-3 text-xs"
				aria-pressed={scope === 'user'}
				onclick={() => (scope = 'user')}
			>
				User
			</Button>
			<Button
				variant={scope === 'project' ? 'secondary' : 'ghost'}
				size="sm"
				class="h-7 px-3 text-xs"
				aria-pressed={scope === 'project'}
				onclick={() => (scope = 'project')}
			>
				Project
			</Button>
		</div>
	</div>

	<Alert.Root>
		<TriangleAlertIcon />
		<Alert.Title>Verify against provider documentation</Alert.Title>
		<Alert.Description>
			Settings may change between provider versions. Use this panel as a quick editor — the
			authoritative reference is the provider's own docs.
		</Alert.Description>
	</Alert.Root>

	{#if aiConfig.provider === 'cursor'}
		<Alert.Root>
			<TriangleAlertIcon />
			<Alert.Title>Most Cursor settings live in the IDE</Alert.Title>
			<Alert.Description>
				Most Cursor settings are configured through the Cursor IDE Settings panel. Only
				agent-specific options are exposed here.
			</Alert.Description>
		</Alert.Root>
	{/if}

	{#if error !== null}
		<Alert.Root variant="destructive">
			<Alert.Title>Failed to load settings</Alert.Title>
			<Alert.Description>{error}</Alert.Description>
		</Alert.Root>
	{/if}

	{#if loading}
		<p class="text-sm text-muted-foreground">Loading settings…</p>
	{:else if definitions.length === 0}
		<p class="text-sm text-muted-foreground">
			No curated settings configured for this provider yet.
		</p>
	{:else}
		<div
			class="flex flex-col divide-y divide-border rounded-lg border border-border bg-surface"
		>
			{#each definitions as def (def.key)}
				{@const current = getValue(def)}
				<div class="flex items-start justify-between gap-4 p-3">
					<div class="flex min-w-0 flex-col gap-0.5">
						<label
							class="text-sm font-medium text-foreground"
							for={`setting-${def.key}`}
						>
							{def.label}
						</label>
						<p class="text-xs text-muted-foreground">{def.description}</p>
						<p class="font-mono text-[10px] text-foreground-subtle">{def.key}</p>
					</div>
					<div class="flex shrink-0 items-center">
						{#if def.control.type === 'toggle'}
							<Switch
								id={`setting-${def.key}`}
								checked={valueAsBoolean(current)}
								onCheckedChange={(checked) => save(def.key, checked)}
							/>
						{:else if def.control.type === 'text'}
							<Input
								id={`setting-${def.key}`}
								class="w-48"
								value={valueAsString(current)}
								oninput={(e) => save(def.key, (e.target as HTMLInputElement).value)}
							/>
						{:else if def.control.type === 'number'}
							<Input
								id={`setting-${def.key}`}
								type="number"
								class="w-24"
								min={def.control.min}
								max={def.control.max}
								step={def.control.step}
								value={valueAsString(current)}
								oninput={(e) =>
									save(def.key, Number((e.target as HTMLInputElement).value))}
							/>
						{:else if def.control.type === 'slider'}
							<div class="flex items-center gap-2">
								<input
									id={`setting-${def.key}`}
									type="range"
									class="w-32 accent-primary"
									min={def.control.min}
									max={def.control.max}
									step={def.control.step ?? 1}
									value={valueAsNumber(current, def.control.min)}
									oninput={(e) =>
										save(def.key, Number((e.target as HTMLInputElement).value))}
								/>
								<span class="font-mono text-xs text-muted-foreground">
									{valueAsNumber(current, def.control.min)}{def.control.suffix ??
										''}
								</span>
							</div>
						{:else if def.control.type === 'select'}
							<Select
								id={`setting-${def.key}`}
								class="w-48"
								value={valueAsString(current)}
								onchange={(e) =>
									save(def.key, (e.target as HTMLSelectElement).value)}
							>
								{#each def.control.options as option (option.value)}
									<option value={option.value}>{option.label}</option>
								{/each}
							</Select>
						{:else if def.control.type === 'segmented'}
							<div
								class="inline-flex rounded-md border border-border bg-surface-2 p-0.5"
							>
								{#each def.control.options as option (option.value)}
									<Button
										variant={valueAsString(current) === option.value
											? 'secondary'
											: 'ghost'}
										size="sm"
										class="h-7 px-2 text-xs"
										aria-pressed={valueAsString(current) === option.value}
										onclick={() => save(def.key, option.value)}
									>
										{option.label}
									</Button>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
