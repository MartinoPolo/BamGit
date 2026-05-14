<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import * as Sheet from './index.js';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { Input } from '$lib/components/shadcn/input/index.js';
	import { Label } from '$lib/components/shadcn/label/index.js';

	const { Story } = defineMeta({
		title: 'Base/Sheet',
		component: Sheet.Root,
		tags: ['autodocs'],
	});
</script>

<Story name="Right Side">
	{#snippet template()}
		<div class="flex items-center justify-center p-16">
			<Sheet.Root>
				<Sheet.Trigger>
					{#snippet child({ props })}
						<Button intent="secondary" {...props}>Open Sheet (Right)</Button>
					{/snippet}
				</Sheet.Trigger>
				<Sheet.Content side="right" portalProps={{ disabled: true }}>
					<Sheet.Header>
						<Sheet.Title>Right Side Sheet</Sheet.Title>
						<Sheet.Description>
							This sheet opens from the right side. Press Escape or click outside to
							close.
						</Sheet.Description>
					</Sheet.Header>
					<div class="p-4">
						<p class="text-muted-foreground text-sm">Sheet content goes here.</p>
					</div>
					<Sheet.Footer>
						<Sheet.Close>
							{#snippet child({ props })}
								<Button intent="secondary" {...props}>Close</Button>
							{/snippet}
						</Sheet.Close>
					</Sheet.Footer>
				</Sheet.Content>
			</Sheet.Root>
		</div>
	{/snippet}
</Story>

<Story name="Left Side">
	{#snippet template()}
		<div class="flex items-center justify-center p-16">
			<Sheet.Root>
				<Sheet.Trigger>
					{#snippet child({ props })}
						<Button intent="secondary" {...props}>Open Sheet (Left)</Button>
					{/snippet}
				</Sheet.Trigger>
				<Sheet.Content side="left" portalProps={{ disabled: true }}>
					<Sheet.Header>
						<Sheet.Title>Left Side Sheet</Sheet.Title>
						<Sheet.Description>
							This sheet opens from the left side. Press Escape or click outside to
							close.
						</Sheet.Description>
					</Sheet.Header>
					<div class="p-4">
						<p class="text-muted-foreground text-sm">Sheet content goes here.</p>
					</div>
					<Sheet.Footer>
						<Sheet.Close>
							{#snippet child({ props })}
								<Button intent="secondary" {...props}>Close</Button>
							{/snippet}
						</Sheet.Close>
					</Sheet.Footer>
				</Sheet.Content>
			</Sheet.Root>
		</div>
	{/snippet}
</Story>

<Story name="Top">
	{#snippet template()}
		<div class="flex items-start justify-center pt-8 pb-32">
			<Sheet.Root>
				<Sheet.Trigger>
					{#snippet child({ props })}
						<Button intent="secondary" {...props}>Open Sheet (Top)</Button>
					{/snippet}
				</Sheet.Trigger>
				<Sheet.Content side="top" portalProps={{ disabled: true }}>
					<Sheet.Header>
						<Sheet.Title>Top Sheet</Sheet.Title>
						<Sheet.Description>This sheet opens from the top.</Sheet.Description>
					</Sheet.Header>
					<div class="p-4">
						<p class="text-muted-foreground text-sm">Sheet content goes here.</p>
					</div>
					<Sheet.Footer>
						<Sheet.Close>
							{#snippet child({ props })}
								<Button intent="secondary" {...props}>Close</Button>
							{/snippet}
						</Sheet.Close>
					</Sheet.Footer>
				</Sheet.Content>
			</Sheet.Root>
		</div>
	{/snippet}
</Story>

<Story name="Bottom">
	{#snippet template()}
		<div class="flex items-end justify-center pb-8 pt-32">
			<Sheet.Root>
				<Sheet.Trigger>
					{#snippet child({ props })}
						<Button intent="secondary" {...props}>Open Sheet (Bottom)</Button>
					{/snippet}
				</Sheet.Trigger>
				<Sheet.Content side="bottom" portalProps={{ disabled: true }}>
					<Sheet.Header>
						<Sheet.Title>Bottom Sheet</Sheet.Title>
						<Sheet.Description>This sheet opens from the bottom.</Sheet.Description>
					</Sheet.Header>
					<div class="p-4">
						<p class="text-muted-foreground text-sm">Sheet content goes here.</p>
					</div>
					<Sheet.Footer>
						<Sheet.Close>
							{#snippet child({ props })}
								<Button intent="secondary" {...props}>Close</Button>
							{/snippet}
						</Sheet.Close>
					</Sheet.Footer>
				</Sheet.Content>
			</Sheet.Root>
		</div>
	{/snippet}
</Story>

<Story name="With Form Content">
	{#snippet template()}
		<div class="flex items-center justify-center p-16">
			<Sheet.Root>
				<Sheet.Trigger>
					{#snippet child({ props })}
						<Button {...props}>Edit Profile</Button>
					{/snippet}
				</Sheet.Trigger>
				<Sheet.Content side="right" portalProps={{ disabled: true }}>
					<Sheet.Header>
						<Sheet.Title>Edit Profile</Sheet.Title>
						<Sheet.Description>
							Update your profile details. Click save when you're done.
						</Sheet.Description>
					</Sheet.Header>
					<div class="flex flex-col gap-4 p-4">
						<div class="flex flex-col gap-1.5">
							<Label for="sheet-name">Display name</Label>
							<Input id="sheet-name" placeholder="Jane Smith" />
						</div>
						<div class="flex flex-col gap-1.5">
							<Label for="sheet-email">Email</Label>
							<Input id="sheet-email" type="email" placeholder="jane@example.com" />
						</div>
						<div class="flex flex-col gap-1.5">
							<Label for="sheet-username">Username</Label>
							<Input id="sheet-username" placeholder="janesmith" />
						</div>
						<div class="flex flex-col gap-1.5">
							<Label for="sheet-bio">Bio</Label>
							<Input id="sheet-bio" placeholder="Tell us about yourself" />
						</div>
					</div>
					<Sheet.Footer>
						<Sheet.Close>
							{#snippet child({ props })}
								<Button intent="secondary" {...props}>Cancel</Button>
							{/snippet}
						</Sheet.Close>
						<Button intent="primary">Save changes</Button>
					</Sheet.Footer>
				</Sheet.Content>
			</Sheet.Root>
		</div>
	{/snippet}
</Story>

<Story name="With Long Content">
	{#snippet template()}
		<div class="flex items-center justify-center p-16">
			<Sheet.Root>
				<Sheet.Trigger>
					{#snippet child({ props })}
						<Button intent="secondary" {...props}>Open Terms</Button>
					{/snippet}
				</Sheet.Trigger>
				<Sheet.Content side="right" portalProps={{ disabled: true }}>
					<Sheet.Header>
						<Sheet.Title>Terms of Service</Sheet.Title>
						<Sheet.Description
							>Please read the full terms before continuing.</Sheet.Description
						>
					</Sheet.Header>
					<div class="flex flex-col gap-4 overflow-y-auto p-4 text-sm">
						{#each Array.from({ length: 8 }, (_, i) => i + 1) as section (section)}
							<div>
								<h3 class="text-foreground mb-1.5 font-medium">
									Section {section} — {[
										'Acceptance of Terms',
										'Use of Service',
										'User Accounts',
										'Privacy Policy',
										'Intellectual Property',
										'Limitation of Liability',
										'Termination',
										'Governing Law',
									][section - 1]}
								</h3>
								<p class="text-muted-foreground leading-relaxed">
									Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
									eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
									enim ad minim veniam, quis nostrud exercitation ullamco laboris
									nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor
									in reprehenderit in voluptate velit esse cillum dolore eu fugiat
									nulla pariatur.
								</p>
							</div>
						{/each}
					</div>
					<Sheet.Footer>
						<Sheet.Close>
							{#snippet child({ props })}
								<Button intent="secondary" {...props}>Decline</Button>
							{/snippet}
						</Sheet.Close>
						<Sheet.Close>
							{#snippet child({ props })}
								<Button intent="primary" {...props}>Accept</Button>
							{/snippet}
						</Sheet.Close>
					</Sheet.Footer>
				</Sheet.Content>
			</Sheet.Root>
		</div>
	{/snippet}
</Story>
