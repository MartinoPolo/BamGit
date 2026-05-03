<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import * as Dialog from './index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Select } from '$lib/components/ui/select/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import ThemeDecorator from '$lib/storybook/ThemeDecorator.svelte';
	import XIcon from '@lucide/svelte/icons/x';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import TrashIcon from '@lucide/svelte/icons/trash';

	const { Story } = defineMeta({
		title: 'UI/Dialog',
		component: Dialog.Root,
		// @ts-expect-error — Storybook decorator typing doesn't match Svelte 5 Component type
		decorators: [() => ThemeDecorator],
		tags: ['autodocs'],
	});
</script>

<Story name="Plant Tree">
	{#snippet template()}
		<div class="flex items-center justify-center p-8">
			<Dialog.Root>
				<Dialog.Trigger>
					{#snippet child({ props })}
						<Button {...props}>
							<PlusIcon class="size-3.5" />
							Plant tree
						</Button>
					{/snippet}
				</Dialog.Trigger>
				<Dialog.Content portalProps={{ disabled: true }}>
					<Dialog.Title class="sr-only">Start a new agent session</Dialog.Title>
					<Dialog.Description class="sr-only">
						Fill in the details to plant a new tree and start a new agent session.
					</Dialog.Description>
					<Dialog.Header>
						<div>
							<div
								class="mb-0.5 text-[length:var(--text-xs)] font-medium uppercase tracking-wider text-foreground-subtle"
							>
								Modal · plant a tree
							</div>
							<div class="text-[length:var(--text-lg)] font-semibold">
								Start a new agent session
							</div>
						</div>
						<Dialog.Close>
							{#snippet child({ props })}
								<Button variant="ghost" size="icon-sm" {...props}>
									<XIcon class="size-3" />
								</Button>
							{/snippet}
						</Dialog.Close>
					</Dialog.Header>
					<Dialog.Body class="grid gap-3">
						<div>
							<Label for="issue-select">Issue</Label>
							<Select id="issue-select">
								<option value="142">#142 · Add usage tracking dashboard</option>
							</Select>
						</div>
						<div class="grid grid-cols-2 gap-2.5">
							<div>
								<Label for="provider-select">Provider</Label>
								<Select id="provider-select">
									<option value="claude">Claude · Sonnet 4.5</option>
								</Select>
							</div>
							<div>
								<Label for="branch-input">Base branch</Label>
								<Input id="branch-input" class="font-mono" value="dev" />
							</div>
						</div>
						<div>
							<Label for="prompt-textarea">Initial prompt (optional)</Label>
							<Textarea
								id="prompt-textarea"
								rows={2}
								placeholder="Pick up from the existing PR draft and add the per-day chart…"
							/>
						</div>
						<div class="flex items-center gap-2">
							<Checkbox id="worktree-checkbox" checked />
							<Label
								for="worktree-checkbox"
								class="mb-0 cursor-pointer text-[length:var(--text-md)]"
							>
								Auto-create worktree
							</Label>
						</div>
					</Dialog.Body>
					<Dialog.Footer>
						<Dialog.Close>
							{#snippet child({ props })}
								<Button variant="ghost" {...props}>Cancel</Button>
							{/snippet}
						</Dialog.Close>
						<Button variant="primary">
							<PlusIcon class="size-3.5" />
							Plant tree
						</Button>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Root>
		</div>
	{/snippet}
</Story>

<Story name="Destructive Confirm">
	{#snippet template()}
		<div class="flex items-center justify-center p-8">
			<Dialog.Root>
				<Dialog.Trigger>
					{#snippet child({ props })}
						<Button variant="danger" {...props}>
							<TrashIcon class="size-3.5" />
							Archive issue
						</Button>
					{/snippet}
				</Dialog.Trigger>
				<Dialog.Content class="max-w-[420px]" portalProps={{ disabled: true }}>
					<Dialog.Title class="sr-only">Archive issue #066</Dialog.Title>
					<Dialog.Description class="sr-only">
						This will remove the worktree and stop any running session.
					</Dialog.Description>
					<Dialog.Header>
						<div>
							<div
								class="mb-0.5 text-[length:var(--text-xs)] font-medium uppercase tracking-wider text-status-danger"
							>
								Modal · destructive confirm
							</div>
							<div class="text-[length:var(--text-lg)] font-semibold">
								Archive #066?
							</div>
						</div>
						<Dialog.Close>
							{#snippet child({ props })}
								<Button variant="ghost" size="icon-sm" {...props}>
									<XIcon class="size-3" />
								</Button>
							{/snippet}
						</Dialog.Close>
					</Dialog.Header>
					<Dialog.Body class="grid gap-3">
						<p class="text-[length:var(--text-sm)] text-foreground-muted">
							This will remove the worktree and stop any running session. The branch
							and PR remain untouched on GitHub.
						</p>
						<div
							class="flex items-center gap-2.5 rounded-lg border border-border bg-surface-2 p-2.5"
						>
							<div
								class="flex size-12 items-center justify-center text-2xl opacity-40"
							>
								🌲
							</div>
							<div>
								<div class="text-[12.5px] font-medium">
									Deprecate polling system
								</div>
								<div
									class="font-mono text-[length:var(--text-2xs)] text-foreground-muted"
								>
									#066 · feat/deprecated-polling
								</div>
							</div>
						</div>
						<div class="flex items-center gap-2">
							<Checkbox id="delete-branch-checkbox" />
							<Label
								for="delete-branch-checkbox"
								class="mb-0 cursor-pointer text-[length:var(--text-md)]"
							>
								Also delete the local branch
							</Label>
						</div>
					</Dialog.Body>
					<Dialog.Footer>
						<Dialog.Close>
							{#snippet child({ props })}
								<Button variant="ghost" {...props}>Cancel</Button>
							{/snippet}
						</Dialog.Close>
						<Button variant="danger">
							<TrashIcon class="size-3.5" />
							Archive
						</Button>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Root>
		</div>
	{/snippet}
</Story>

<Story name="Open by Default">
	{#snippet template()}
		<div class="flex items-center justify-center p-8">
			<Dialog.Root open={true}>
				<Dialog.Content portalProps={{ disabled: true }}>
					<Dialog.Title class="sr-only">Open by default</Dialog.Title>
					<Dialog.Description class="sr-only">
						This dialog renders open for visual testing in Storybook.
					</Dialog.Description>
					<Dialog.Header>
						<div>
							<div
								class="mb-0.5 text-[length:var(--text-xs)] font-medium uppercase tracking-wider text-foreground-subtle"
							>
								Modal · open by default
							</div>
							<div class="text-[length:var(--text-lg)] font-semibold">
								Start a new agent session
							</div>
						</div>
						<Dialog.Close>
							{#snippet child({ props })}
								<Button variant="ghost" size="icon-sm" {...props}>
									<XIcon class="size-3" />
								</Button>
							{/snippet}
						</Dialog.Close>
					</Dialog.Header>
					<Dialog.Body class="grid gap-3">
						<div>
							<Label for="issue-select-open">Issue</Label>
							<Select id="issue-select-open">
								<option value="142">#142 · Add usage tracking dashboard</option>
							</Select>
						</div>
						<div class="grid grid-cols-2 gap-2.5">
							<div>
								<Label for="provider-select-open">Provider</Label>
								<Select id="provider-select-open">
									<option value="claude">Claude · Sonnet 4.5</option>
								</Select>
							</div>
							<div>
								<Label for="branch-input-open">Base branch</Label>
								<Input id="branch-input-open" class="font-mono" value="dev" />
							</div>
						</div>
					</Dialog.Body>
					<Dialog.Footer>
						<Dialog.Close>
							{#snippet child({ props })}
								<Button variant="ghost" {...props}>Cancel</Button>
							{/snippet}
						</Dialog.Close>
						<Button variant="primary">
							<PlusIcon class="size-3.5" />
							Plant tree
						</Button>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Root>
		</div>
	{/snippet}
</Story>
