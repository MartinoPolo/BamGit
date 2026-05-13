<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import * as Dialog from './index.js';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { Input } from '$lib/components/shadcn/input/index.js';
	import { Textarea } from '$lib/components/shadcn/textarea/index.js';
	import { Select } from '$lib/components/shadcn/select/index.js';
	import { Checkbox } from '$lib/components/shadcn/checkbox/index.js';
	import { Label } from '$lib/components/shadcn/label/index.js';
	import XIcon from '@lucide/svelte/icons/x';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import TrashIcon from '@lucide/svelte/icons/trash';
	import CornerDownLeftIcon from '@lucide/svelte/icons/corner-down-left';
	import { Kbd } from '$lib/components/shadcn/kbd/index.js';

	const { Story } = defineMeta({
		title: 'Base/Dialog',
		component: Dialog.Root,
		tags: ['autodocs'],
	});
</script>

<Story name="Create Issue">
	{#snippet template()}
		<div class="flex items-center justify-center p-8">
			<Dialog.Root>
				<Dialog.Trigger>
					{#snippet child({ props })}
						<Button {...props}>
							<PlusIcon class="size-3.5" />
							Create Issue
						</Button>
					{/snippet}
				</Dialog.Trigger>
				<Dialog.Content portalProps={{ disabled: true }}>
					<Dialog.Title class="sr-only">Start a new agent session</Dialog.Title>
					<Dialog.Description class="sr-only">
						Fill in the details to create a new issue and start an agent session.
					</Dialog.Description>
					<Dialog.Header>
						<div>
							<div
								class="mb-0.5 text-(length:--text-xs) font-medium uppercase tracking-wider text-foreground-subtle"
							>
								Modal · create issue
							</div>
							<div class="text-(length:--text-lg) font-semibold">
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
								class="mb-0 cursor-pointer text-(length:--text-md)"
							>
								Auto-create worktree
							</Label>
						</div>
					</Dialog.Body>
					<Dialog.Footer>
						<Dialog.Close>
							{#snippet child({ props })}
								<Button variant="ghost" {...props}>Cancel <Kbd>Esc</Kbd></Button>
							{/snippet}
						</Dialog.Close>
						<Button variant="primary">
							<PlusIcon class="size-3.5" />
							Create Issue
							<Kbd variant="lucide" tone="inverted"><CornerDownLeftIcon /></Kbd>
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
				<Dialog.Content class="max-w-105" portalProps={{ disabled: true }}>
					<Dialog.Title class="sr-only">Archive issue #066</Dialog.Title>
					<Dialog.Description class="sr-only">
						This will remove the worktree and stop any running session.
					</Dialog.Description>
					<Dialog.Header>
						<div>
							<div
								class="mb-0.5 text-(length:--text-xs) font-medium uppercase tracking-wider text-status-danger"
							>
								Modal · destructive confirm
							</div>
							<div class="text-(length:--text-lg) font-semibold">Archive #066?</div>
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
						<p class="text-(length:--text-sm) text-foreground-muted">
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
									class="font-mono text-(length:--text-2xs) text-foreground-muted"
								>
									#066 · feat/deprecated-polling
								</div>
							</div>
						</div>
						<div class="flex items-center gap-2">
							<Checkbox id="delete-branch-checkbox" />
							<Label
								for="delete-branch-checkbox"
								class="mb-0 cursor-pointer text-(length:--text-md)"
							>
								Also delete the local branch
							</Label>
						</div>
					</Dialog.Body>
					<Dialog.Footer>
						<Dialog.Close>
							{#snippet child({ props })}
								<Button variant="ghost" {...props}>Cancel <Kbd>Esc</Kbd></Button>
							{/snippet}
						</Dialog.Close>
						<Button variant="primary-destructive">
							<TrashIcon class="size-3.5" />
							Archive
							<Kbd variant="lucide" tone="inverted"><CornerDownLeftIcon /></Kbd>
						</Button>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Root>
		</div>
	{/snippet}
</Story>
