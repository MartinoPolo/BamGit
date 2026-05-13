<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { BUTTON_SIZES, BUTTON_VARIANTS, Button } from './index.js';

	const { Story } = defineMeta({
		title: 'Base/Button',
		component: Button,
		tags: ['autodocs'],
		argTypes: {
			variant: {
				control: 'select',
				options: [...BUTTON_VARIANTS],
			},
			size: {
				control: 'select',
				options: [...BUTTON_SIZES],
			},
			disabled: { control: 'boolean' },
		},
	});
</script>

<script lang="ts">
	import { BUTTON_TEXT_SIZES, BUTTON_ICON_SIZES, type ButtonProps } from './button-variants.js';
	import MailIcon from '@lucide/svelte/icons/mail';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import CornerDownLeftIcon from '@lucide/svelte/icons/corner-down-left';
	import DeleteIcon from '@lucide/svelte/icons/delete';
	import { Kbd } from '$lib/components/shadcn/kbd/index.js';
</script>

<Story name="Primary" args={{ variant: 'primary' }}>
	{#snippet template(args: ButtonProps)}
		<Button {...args}>Primary</Button>
	{/snippet}
</Story>

<Story name="Secondary">
	{#snippet template(args: ButtonProps)}
		<Button variant="secondary" {...args}>Secondary</Button>
	{/snippet}
</Story>

<Story name="Ghost">
	{#snippet template(args: ButtonProps)}
		<Button variant="ghost" {...args}>Ghost</Button>
	{/snippet}
</Story>

<Story name="Ghost Overlay">
	{#snippet template(args: ButtonProps)}
		<div class="flex gap-4">
			<div class="rounded-lg bg-primary p-4">
				<div class="flex items-center gap-2">
					<Button variant="ghost-overlay" size="icon-sm" {...args}><MailIcon /></Button>
					<Button variant="ghost-overlay" size="icon-sm" {...args}
						><SettingsIcon /></Button
					>
					<Button variant="ghost-overlay" {...args}>Action</Button>
				</div>
			</div>
			<div class="rounded-lg bg-surface-2 p-4">
				<div class="flex items-center gap-2">
					<Button variant="ghost-overlay" size="icon-sm" {...args}><MailIcon /></Button>
					<Button variant="ghost-overlay" size="icon-sm" {...args}
						><SettingsIcon /></Button
					>
					<Button variant="ghost-overlay" {...args}>Action</Button>
				</div>
			</div>
		</div>
	{/snippet}
</Story>

<Story name="Danger">
	{#snippet template(args: ButtonProps)}
		<Button variant="danger" {...args}>Danger</Button>
	{/snippet}
</Story>

<Story name="Primary Destructive">
	{#snippet template(args: ButtonProps)}
		<Button variant="primary-destructive" {...args}>Delete</Button>
	{/snippet}
</Story>

<Story name="Disabled">
	{#snippet template(args: ButtonProps)}
		<div class="flex flex-wrap items-center gap-4">
			<Button variant="primary" disabled {...args}>Primary</Button>
			<Button variant="secondary" disabled {...args}>Secondary</Button>
			<Button variant="ghost" disabled {...args}>Ghost</Button>
			<Button variant="ghost-overlay" disabled {...args}>Ghost Overlay</Button>
			<Button variant="danger" disabled {...args}>Danger</Button>
		</div>
	{/snippet}
</Story>

<Story name="All Variants">
	{#snippet template(args: ButtonProps)}
		<div class="flex flex-col gap-10 w-130">
			<!-- Grid 1: Text buttons -->
			<div class="flex flex-col gap-3">
				<p class="text-sm font-medium text-foreground-muted">Text buttons</p>
				<div class="grid grid-cols-[9rem_repeat(3,minmax(0,1fr))] items-center gap-3">
					<div></div>
					{#each BUTTON_TEXT_SIZES as size (size)}
						<div class="text-center text-xs text-foreground-muted">{size}</div>
					{/each}
					{#each BUTTON_VARIANTS as variant (variant)}
						<div class="text-xs text-foreground-muted">{variant}</div>
						{#each BUTTON_TEXT_SIZES as size (size)}
							<div class="flex justify-center">
								<Button {...args} {variant} {size}>Label</Button>
							</div>
						{/each}
					{/each}
				</div>
			</div>

			<!-- Grid 2: Icon-only buttons (ghost-overlay excluded) -->
			<div class="flex flex-col gap-3">
				<p class="text-sm font-medium text-foreground-muted">Icon-only buttons</p>
				<div class="grid grid-cols-[9rem_repeat(2,minmax(0,1fr))] items-center gap-3">
					<div></div>
					{#each BUTTON_ICON_SIZES as size (size)}
						<div class="text-center text-xs text-foreground-muted">{size}</div>
					{/each}
					{#each BUTTON_VARIANTS as variant (variant)}
						<div class="text-xs text-foreground-muted">{variant}</div>
						{#each BUTTON_ICON_SIZES as size (size)}
							<div class="flex justify-center">
								<Button {...args} {variant} {size}><PlusIcon /></Button>
							</div>
						{/each}
					{/each}
				</div>
			</div>

			<!-- Grid 3: Icon + text buttons -->
			<div class="flex flex-col gap-3">
				<p class="text-sm font-medium text-foreground-muted">Icon + text</p>
				<div class="grid grid-cols-[9rem_repeat(3,minmax(0,1fr))] items-center gap-3">
					<div></div>
					{#each BUTTON_TEXT_SIZES as size (size)}
						<div class="text-center text-xs text-foreground-muted">{size}</div>
					{/each}
					{#each BUTTON_VARIANTS as variant (variant)}
						<div class="text-xs text-foreground-muted">{variant}</div>
						{#each BUTTON_TEXT_SIZES as size (size)}
							<div class="flex justify-center">
								<Button {...args} {variant} {size}><PlusIcon /> Label</Button>
							</div>
						{/each}
					{/each}
				</div>
			</div>

			<!-- Grid 4: Buttons with keyboard shortcuts -->
			<div class="flex flex-col gap-3">
				<p class="text-sm font-medium text-foreground-muted">With keyboard shortcuts</p>
				<div class="grid grid-cols-[9rem_repeat(3,minmax(0,1fr))] items-center gap-3">
					<div></div>
					{#each BUTTON_TEXT_SIZES as size (size)}
						<div class="text-center text-xs text-foreground-muted">{size}</div>
					{/each}
					{#each BUTTON_VARIANTS as variant (variant)}
						<div class="text-xs text-foreground-muted">{variant}</div>
						{#each BUTTON_TEXT_SIZES as size (size)}
							<div class="flex justify-center">
								<Button {...args} {variant} {size}>
									Action
									{#if variant === 'primary' || variant === 'primary-destructive' || variant === 'contextual-primary'}
										<Kbd variant="inverted"><CornerDownLeftIcon /></Kbd>
									{:else}
										<Kbd><CornerDownLeftIcon /></Kbd>
									{/if}
								</Button>
							</div>
						{/each}
					{/each}
				</div>
			</div>
		</div>
	{/snippet}
</Story>

<Story name="Icon Only">
	{#snippet template(args: ButtonProps)}
		<div class="flex flex-wrap items-center gap-4">
			<Button variant="primary" size="icon" {...args}><PlusIcon /></Button>
			<Button variant="secondary" size="icon" {...args}><SettingsIcon /></Button>
			<Button variant="ghost" size="icon" {...args}><MailIcon /></Button>
			<Button variant="danger" size="icon" {...args}><TrashIcon /></Button>
			<Button variant="primary" size="icon-sm" {...args}><PlusIcon /></Button>
			<Button variant="ghost" size="icon-sm" {...args}><SettingsIcon /></Button>
		</div>
	{/snippet}
</Story>

<Story name="With Icons">
	{#snippet template(args: ButtonProps)}
		<div class="flex flex-wrap items-center gap-4">
			<Button variant="primary" {...args}><PlusIcon /> Create</Button>
			<Button variant="secondary" {...args}><SettingsIcon /> Settings</Button>
			<Button variant="ghost" {...args}><MailIcon /> Mail</Button>
			<Button variant="danger" {...args}><TrashIcon /> Delete</Button>
		</div>
	{/snippet}
</Story>
<Story name="With Keyboard Shortcuts">
	{#snippet template(args: ButtonProps)}
		<div class="flex flex-col gap-6">
			<div>
				<p class="mb-2 text-sm text-foreground-muted">Primary with Enter shortcut</p>
				<Button variant="primary" {...args}>
					Create
					<Kbd variant="inverted"><CornerDownLeftIcon /></Kbd>
				</Button>
			</div>
			<div>
				<p class="mb-2 text-sm text-foreground-muted">Ghost with Esc shortcut</p>
				<Button variant="ghost" {...args}>
					Cancel
					<Kbd>Esc</Kbd>
				</Button>
			</div>
			<div>
				<p class="mb-2 text-sm text-foreground-muted">Ghost with Backspace shortcut</p>
				<Button variant="ghost" {...args}>
					Back
					<Kbd><DeleteIcon /></Kbd>
				</Button>
			</div>
			<div>
				<p class="mb-2 text-sm text-foreground-muted">Secondary with Enter shortcut</p>
				<Button variant="secondary" {...args}>
					Confirm
					<Kbd><CornerDownLeftIcon /></Kbd>
				</Button>
			</div>
			<div>
				<p class="mb-2 text-sm text-foreground-muted">Wizard footer example</p>
				<div class="flex items-center gap-2">
					<Button variant="ghost" size="sm" {...args}>
						Back
						<Kbd><DeleteIcon /></Kbd>
					</Button>
					<div class="flex-1"></div>
					<Button variant="ghost" size="sm" {...args}>
						Cancel
						<Kbd>Esc</Kbd>
					</Button>
					<Button variant="primary" size="sm" {...args}>
						Create
						<Kbd variant="inverted"><CornerDownLeftIcon /></Kbd>
					</Button>
				</div>
			</div>
		</div>
	{/snippet}
</Story>
