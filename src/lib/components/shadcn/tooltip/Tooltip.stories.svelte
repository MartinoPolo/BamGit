<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import * as Tooltip from './index.js';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { Kbd } from '$lib/components/shadcn/kbd/index.js';
	import { formatBindingForDisplay } from '$lib/modules/keyboard-shortcuts/index.js';
	import SettingsIcon from '@lucide/svelte/icons/settings';

	const { Story } = defineMeta({
		title: 'Base/Tooltip',
		component: Tooltip.Provider,
		tags: ['autodocs'],
	});
</script>

<Story name="Composition">
	{#snippet template()}
		<Tooltip.Provider>
			<div class="flex items-center justify-center p-16">
				<Tooltip.Root>
					<Tooltip.Trigger>
						{#snippet child({ props })}
							<Button {...props} intent="secondary" size="sm">Hover me</Button>
						{/snippet}
					</Tooltip.Trigger>
					<Tooltip.Content side="top" portalProps={{ disabled: true }}
						>Sync now</Tooltip.Content
					>
				</Tooltip.Root>
			</div>
		</Tooltip.Provider>
	{/snippet}
</Story>

<Story name="SimpleTooltip">
	{#snippet template()}
		<div class="flex items-center justify-center p-16">
			<Tooltip.SimpleTooltip text="Sync now">
				{#snippet asChild(props)}
					<Button {...props} intent="secondary" size="sm">Hover me</Button>
				{/snippet}
			</Tooltip.SimpleTooltip>
		</div>
	{/snippet}
</Story>

<Story name="Bottom">
	{#snippet template()}
		<Tooltip.Provider>
			<div class="flex items-center justify-center p-16">
				<Tooltip.Root>
					<Tooltip.Trigger>
						{#snippet child({ props })}
							<Button {...props} intent="secondary" size="sm">Hover me</Button>
						{/snippet}
					</Tooltip.Trigger>
					<Tooltip.Content side="bottom" portalProps={{ disabled: true }}>
						Create issue
						<Kbd>{formatBindingForDisplay('Ctrl+N')}</Kbd>
					</Tooltip.Content>
				</Tooltip.Root>
			</div>
		</Tooltip.Provider>
	{/snippet}
</Story>

<Story name="Left">
	{#snippet template()}
		<Tooltip.Provider>
			<div class="flex items-center justify-center p-16">
				<Tooltip.Root>
					<Tooltip.Trigger>
						{#snippet child({ props })}
							<Button
								{...props}
								intent="secondary"
								size="icon-sm"
								aria-label="Settings"
							>
								<SettingsIcon />
							</Button>
						{/snippet}
					</Tooltip.Trigger>
					<Tooltip.Content side="left" portalProps={{ disabled: true }}
						>Filter issues</Tooltip.Content
					>
				</Tooltip.Root>
			</div>
		</Tooltip.Provider>
	{/snippet}
</Story>

<Story name="Right">
	{#snippet template()}
		<Tooltip.Provider>
			<div class="flex items-center justify-center p-16">
				<Tooltip.Root>
					<Tooltip.Trigger>
						{#snippet child({ props })}
							<Button
								{...props}
								intent="secondary"
								size="icon-sm"
								aria-label="Settings"
							>
								<SettingsIcon />
							</Button>
						{/snippet}
					</Tooltip.Trigger>
					<Tooltip.Content side="right" portalProps={{ disabled: true }}
						>Forest view</Tooltip.Content
					>
				</Tooltip.Root>
			</div>
		</Tooltip.Provider>
	{/snippet}
</Story>

<Story name="With Kbd">
	{#snippet template()}
		<Tooltip.Provider>
			<div class="flex items-center justify-center p-16">
				<Tooltip.Root>
					<Tooltip.Trigger>
						{#snippet child({ props })}
							<Button {...props} intent="secondary" size="sm">Create issue</Button>
						{/snippet}
					</Tooltip.Trigger>
					<Tooltip.Content side="top" portalProps={{ disabled: true }}>
						Start a new agent session
						<Kbd>{formatBindingForDisplay('Ctrl+N')}</Kbd>
					</Tooltip.Content>
				</Tooltip.Root>
			</div>
		</Tooltip.Provider>
	{/snippet}
</Story>

<Story name="Rich">
	{#snippet template()}
		<Tooltip.Provider>
			<div class="flex items-center justify-center p-16">
				<Tooltip.Root>
					<Tooltip.Trigger>
						{#snippet child({ props })}
							<div
								{...props}
								class="flex size-14 items-center justify-center rounded-lg border border-border bg-surface-2 text-2xl"
							>
								🌳
							</div>
						{/snippet}
					</Tooltip.Trigger>
					<Tooltip.Content
						side="top"
						class="w-55 whitespace-normal p-2.5"
						portalProps={{ disabled: true }}
					>
						<div class="font-semibold">#128 · Build kanban DnD</div>
						<div class="mt-0.5 text-[10.5px] leading-undefined opacity-80">
							Claude · 2m 14s · 3 commits ahead
						</div>
					</Tooltip.Content>
				</Tooltip.Root>
			</div>
		</Tooltip.Provider>
	{/snippet}
</Story>

<Story name="Delay 0ms">
	{#snippet template()}
		<div class="flex items-center justify-center p-16">
			<Tooltip.SimpleTooltip text="Instant — no delay" delayDuration={0}>
				{#snippet asChild(props)}
					<Button {...props} intent="secondary" size="sm">Hover me (instant)</Button>
				{/snippet}
			</Tooltip.SimpleTooltip>
		</div>
	{/snippet}
</Story>

<Story name="Delay 300ms">
	{#snippet template()}
		<div class="flex items-center justify-center p-16">
			<Tooltip.SimpleTooltip text="300ms delay" delayDuration={300}>
				{#snippet asChild(props)}
					<Button {...props} intent="secondary" size="sm">Hover me (300ms)</Button>
				{/snippet}
			</Tooltip.SimpleTooltip>
		</div>
	{/snippet}
</Story>

<Story name="Delay 700ms">
	{#snippet template()}
		<div class="flex items-center justify-center p-16">
			<Tooltip.SimpleTooltip text="700ms delay — deliberate hover" delayDuration={700}>
				{#snippet asChild(props)}
					<Button {...props} intent="secondary" size="sm">Hover me (700ms)</Button>
				{/snippet}
			</Tooltip.SimpleTooltip>
		</div>
	{/snippet}
</Story>

<Story name="All Directions">
	{#snippet template()}
		<Tooltip.Provider>
			<div class="grid grid-cols-2 gap-16 p-20">
				<div class="flex items-center justify-center">
					<Tooltip.Root open={true}>
						<Tooltip.Trigger>
							{#snippet child({ props })}
								<Button
									{...props}
									intent="secondary"
									size="icon-sm"
									aria-label="Top"
								>
									<SettingsIcon />
								</Button>
							{/snippet}
						</Tooltip.Trigger>
						<Tooltip.Content side="top" portalProps={{ disabled: true }}>
							Top
						</Tooltip.Content>
					</Tooltip.Root>
				</div>
				<div class="flex items-center justify-center">
					<Tooltip.Root open={true}>
						<Tooltip.Trigger>
							{#snippet child({ props })}
								<Button
									{...props}
									intent="secondary"
									size="icon-sm"
									aria-label="Bottom"
								>
									<SettingsIcon />
								</Button>
							{/snippet}
						</Tooltip.Trigger>
						<Tooltip.Content side="bottom" portalProps={{ disabled: true }}>
							Bottom
						</Tooltip.Content>
					</Tooltip.Root>
				</div>
				<div class="flex items-center justify-center">
					<Tooltip.Root open={true}>
						<Tooltip.Trigger>
							{#snippet child({ props })}
								<Button
									{...props}
									intent="secondary"
									size="icon-sm"
									aria-label="Left"
								>
									<SettingsIcon />
								</Button>
							{/snippet}
						</Tooltip.Trigger>
						<Tooltip.Content side="left" portalProps={{ disabled: true }}>
							Left
						</Tooltip.Content>
					</Tooltip.Root>
				</div>
				<div class="flex items-center justify-center">
					<Tooltip.Root open={true}>
						<Tooltip.Trigger>
							{#snippet child({ props })}
								<Button
									{...props}
									intent="secondary"
									size="icon-sm"
									aria-label="Right"
								>
									<SettingsIcon />
								</Button>
							{/snippet}
						</Tooltip.Trigger>
						<Tooltip.Content side="right" portalProps={{ disabled: true }}>
							Right
						</Tooltip.Content>
					</Tooltip.Root>
				</div>
			</div>
		</Tooltip.Provider>
	{/snippet}
</Story>

<Story name="All Open">
	{#snippet template()}
		<Tooltip.Provider>
			<div class="flex flex-wrap items-center justify-center gap-20 p-20">
				<Tooltip.Root open={true}>
					<Tooltip.Trigger>
						{#snippet child({ props })}
							<Button {...props} intent="secondary" size="sm">Hover me</Button>
						{/snippet}
					</Tooltip.Trigger>
					<Tooltip.Content side="top" portalProps={{ disabled: true }}>
						Sync now
					</Tooltip.Content>
				</Tooltip.Root>
				<Tooltip.Root open={true}>
					<Tooltip.Trigger>
						{#snippet child({ props })}
							<Button {...props} intent="secondary" size="sm">Create issue</Button>
						{/snippet}
					</Tooltip.Trigger>
					<Tooltip.Content side="top" portalProps={{ disabled: true }}>
						Create issue
						<Kbd>{formatBindingForDisplay('Ctrl+N')}</Kbd>
					</Tooltip.Content>
				</Tooltip.Root>
				<Tooltip.Root open={true}>
					<Tooltip.Trigger>
						{#snippet child({ props })}
							<Button {...props} intent="secondary" size="sm">Forest view</Button>
						{/snippet}
					</Tooltip.Trigger>
					<Tooltip.Content side="bottom" portalProps={{ disabled: true }}>
						Switch to forest view
					</Tooltip.Content>
				</Tooltip.Root>
				<Tooltip.Root open={true}>
					<Tooltip.Trigger>
						<div
							class="flex size-14 items-center justify-center rounded-lg border border-border bg-surface-2 text-2xl"
						>
							🌳
						</div>
					</Tooltip.Trigger>
					<Tooltip.Content
						side="bottom"
						class="w-55 whitespace-normal p-2.5"
						portalProps={{ disabled: true }}
					>
						<div class="font-semibold">#128 · Build kanban DnD</div>
						<div class="mt-0.5 text-[10.5px] opacity-80">
							Claude · 2m 14s · 3 commits ahead
						</div>
					</Tooltip.Content>
				</Tooltip.Root>
			</div>
		</Tooltip.Provider>
	{/snippet}
</Story>

<Story name="All Placements">
	{#snippet template()}
		<Tooltip.Provider>
			<div class="grid grid-cols-2 gap-16 p-20">
				<div class="flex items-center justify-center">
					<Tooltip.Root>
						<Tooltip.Trigger>
							{#snippet child({ props })}
								<Button
									{...props}
									intent="secondary"
									size="icon-sm"
									aria-label="Top placement"
								>
									<SettingsIcon />
								</Button>
							{/snippet}
						</Tooltip.Trigger>
						<Tooltip.Content side="top" portalProps={{ disabled: true }}
							>Top · Sync now</Tooltip.Content
						>
					</Tooltip.Root>
				</div>
				<div class="flex items-center justify-center">
					<Tooltip.Root>
						<Tooltip.Trigger>
							{#snippet child({ props })}
								<Button
									{...props}
									intent="secondary"
									size="icon-sm"
									aria-label="Bottom placement"
								>
									<SettingsIcon />
								</Button>
							{/snippet}
						</Tooltip.Trigger>
						<Tooltip.Content side="bottom" portalProps={{ disabled: true }}
							>Bottom · Create issue</Tooltip.Content
						>
					</Tooltip.Root>
				</div>
				<div class="flex items-center justify-center">
					<Tooltip.Root>
						<Tooltip.Trigger>
							{#snippet child({ props })}
								<Button
									{...props}
									intent="secondary"
									size="icon-sm"
									aria-label="Left placement"
								>
									<SettingsIcon />
								</Button>
							{/snippet}
						</Tooltip.Trigger>
						<Tooltip.Content side="left" portalProps={{ disabled: true }}
							>Left · Filter issues</Tooltip.Content
						>
					</Tooltip.Root>
				</div>
				<div class="flex items-center justify-center">
					<Tooltip.Root>
						<Tooltip.Trigger>
							{#snippet child({ props })}
								<Button
									{...props}
									intent="secondary"
									size="icon-sm"
									aria-label="Right placement"
								>
									<SettingsIcon />
								</Button>
							{/snippet}
						</Tooltip.Trigger>
						<Tooltip.Content side="right" portalProps={{ disabled: true }}
							>Right · Forest view</Tooltip.Content
						>
					</Tooltip.Root>
				</div>
			</div>
		</Tooltip.Provider>
	{/snippet}
</Story>
