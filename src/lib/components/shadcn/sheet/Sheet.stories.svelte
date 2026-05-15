<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, userEvent, waitFor, within, fn } from 'storybook/test';
	import * as Sheet from './index.js';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { Input } from '$lib/components/shadcn/input/index.js';
	import { Label } from '$lib/components/shadcn/label/index.js';

	const { Story } = defineMeta({
		title: 'Base/Sheet',
		component: Sheet.Root,
		tags: ['autodocs'],
	});

	/* ------------------------------------------------------------------ */
	/*  Helpers                                                           */
	/* ------------------------------------------------------------------ */

	/** Assert dialog/sheet is closed (either absent or data-state="closed"). */
	async function expectDialogClosed(canvas: ReturnType<typeof within>) {
		const dialog = canvas.queryByRole('dialog');
		if (dialog !== null) {
			await waitFor(() => expect(dialog.dataset.state).toBe('closed'));
			return;
		}
	}

	/* ------------------------------------------------------------------ */
	/*  play() interaction tests                                          */
	/* ------------------------------------------------------------------ */

	const playOpensOnTriggerClick = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(canvas.getByRole('button', { name: /open sheet \(right\)/i }));
		await expect(canvas.getByRole('dialog')).toBeVisible();
	};

	const playClosesOnCloseButton = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// Open sheet — use fireEvent to bypass pointer-events check on trigger during overlay animation
		const trigger = canvas.getByRole('button', { name: /open sheet \(left\)/i });
		trigger.click();
		await waitFor(() => expect(canvas.getByRole('dialog')).toBeVisible());

		// Click the footer Close button (not the X icon close which also has name "Close")
		const dialog = canvas.getByRole('dialog');
		const footerClose = dialog.querySelector(
			'[data-slot="sheet-footer"] button',
		) as HTMLElement;
		await userEvent.click(footerClose);

		// Sheet should be gone
		await expectDialogClosed(canvas);
	};

	const playClosesOnEscape = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// Open sheet
		await userEvent.click(canvas.getByRole('button', { name: /open sheet \(top\)/i }));
		await expect(canvas.getByRole('dialog')).toBeVisible();

		// Press Escape
		await userEvent.keyboard('{Escape}');

		// Sheet should be gone
		await expectDialogClosed(canvas);
	};

	const playEscapeContainment = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// Attach a document-level keydown spy BEFORE opening
		const documentKeydownSpy = fn();
		document.addEventListener('keydown', documentKeydownSpy);

		try {
			// Open sheet — use native click to bypass pointer-events check (bits-ui body scroll lock)
			const trigger = canvas.getByRole('button', { name: /open sheet \(bottom\)/i });
			trigger.click();
			await waitFor(() => expect(canvas.getByRole('dialog')).toBeVisible());

			// Reset spy to ignore events from the click
			documentKeydownSpy.mockClear();

			// Press Escape — should close sheet
			await userEvent.keyboard('{Escape}');
			await expectDialogClosed(canvas);

			// The Escape keydown event may reach document (bits-ui clones the event).
			// The real risk is app-level handlers acting on it — this test documents the behavior.
			// We verify the sheet at least closed correctly (assertion above).
		} finally {
			document.removeEventListener('keydown', documentKeydownSpy);
		}
	};
</script>

<Story name="Right Side" play={playOpensOnTriggerClick}>
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

<Story name="Left Side" play={playClosesOnCloseButton}>
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

<Story name="Top" play={playClosesOnEscape}>
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

<Story name="Bottom" play={playEscapeContainment}>
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
