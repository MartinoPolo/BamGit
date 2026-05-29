<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import {
		InputGroup,
		InputGroupAddon,
		InputGroupButton,
		InputGroupInput,
		InputGroupText,
		InputGroupTextarea,
	} from './index.js';

	const ADDON_ALIGNS = ['inline-start', 'inline-end', 'block-start', 'block-end'] as const;
	const BUTTON_SIZES = ['xs', 'icon-xs', 'icon-sm'] as const;

	const { Story } = defineMeta({
		title: 'Base/InputGroup',
		component: InputGroup,
		tags: ['autodocs'],
	});
</script>

<script lang="ts">
	import SearchIcon from '@lucide/svelte/icons/search';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import AtSignIcon from '@lucide/svelte/icons/at-sign';
	import DollarSignIcon from '@lucide/svelte/icons/dollar-sign';
	import GlobeIcon from '@lucide/svelte/icons/globe';
	import SendIcon from '@lucide/svelte/icons/send';
</script>

<Story name="All Variants">
	{#snippet template()}
		<div class="flex flex-col gap-10 p-6" style="max-width: 480px">
			<div class="flex flex-col gap-3">
				<p class="text-sm font-medium text-foreground-muted">Inline addons</p>
				<div class="flex flex-col gap-2">
					<InputGroup>
						<InputGroupAddon align="inline-start">
							<AtSignIcon />
						</InputGroupAddon>
						<InputGroupInput placeholder="username" />
					</InputGroup>

					<InputGroup>
						<InputGroupInput placeholder="Amount" />
						<InputGroupAddon align="inline-end">
							<DollarSignIcon />
						</InputGroupAddon>
					</InputGroup>

					<InputGroup>
						<InputGroupAddon align="inline-start">
							<GlobeIcon />
						</InputGroupAddon>
						<InputGroupInput placeholder="https://example.com" />
						<InputGroupAddon align="inline-end">
							<CopyIcon />
						</InputGroupAddon>
					</InputGroup>
				</div>
			</div>

			<div class="flex flex-col gap-3">
				<p class="text-sm font-medium text-foreground-muted">Text addons</p>
				<div class="flex flex-col gap-2">
					<InputGroup>
						<InputGroupAddon align="inline-start">
							<InputGroupText>https://</InputGroupText>
						</InputGroupAddon>
						<InputGroupInput placeholder="domain.com" />
					</InputGroup>

					<InputGroup>
						<InputGroupInput placeholder="0.00" />
						<InputGroupAddon align="inline-end">
							<InputGroupText>USD</InputGroupText>
						</InputGroupAddon>
					</InputGroup>
				</div>
			</div>

			<div class="flex flex-col gap-3">
				<p class="text-sm font-medium text-foreground-muted">Button addons</p>
				<div class="flex flex-col gap-2">
					<InputGroup>
						<InputGroupAddon align="inline-start">
							<InputGroupButton aria-label="Search">
								<SearchIcon />
							</InputGroupButton>
						</InputGroupAddon>
						<InputGroupInput placeholder="Search..." />
					</InputGroup>

					<InputGroup>
						<InputGroupInput placeholder="Enter text" />
						<InputGroupAddon align="inline-end">
							<InputGroupButton aria-label="Send">
								<SendIcon />
							</InputGroupButton>
						</InputGroupAddon>
					</InputGroup>

					<InputGroup>
						<InputGroupInput placeholder="Secret value" type="password" />
						<InputGroupAddon align="inline-end">
							<InputGroupButton size="icon-xs" aria-label="Show">
								<EyeIcon />
							</InputGroupButton>
							<InputGroupButton size="icon-xs" aria-label="Copy">
								<CopyIcon />
							</InputGroupButton>
						</InputGroupAddon>
					</InputGroup>
				</div>
			</div>

			<div class="flex flex-col gap-3">
				<p class="text-sm font-medium text-foreground-muted">Block addons</p>
				<div class="flex flex-col gap-2">
					<InputGroup>
						<InputGroupAddon align="block-start">
							<InputGroupText>Label above</InputGroupText>
						</InputGroupAddon>
						<InputGroupInput placeholder="Value" />
					</InputGroup>

					<InputGroup>
						<InputGroupInput placeholder="Value" />
						<InputGroupAddon align="block-end">
							<InputGroupText>Helper text below</InputGroupText>
						</InputGroupAddon>
					</InputGroup>
				</div>
			</div>

			<div class="flex flex-col gap-3">
				<p class="text-sm font-medium text-foreground-muted">Textarea</p>
				<InputGroup>
					<InputGroupAddon align="block-start">
						<InputGroupText>Message</InputGroupText>
					</InputGroupAddon>
					<InputGroupTextarea placeholder="Enter your message..." rows={4} />
					<InputGroupAddon align="block-end">
						<InputGroupButton>Send</InputGroupButton>
					</InputGroupAddon>
				</InputGroup>
			</div>
		</div>
	{/snippet}
</Story>

<Story name="Inline Start Addons">
	{#snippet template()}
		<div class="flex flex-col gap-3 p-6" style="max-width: 480px">
			<p class="text-xs text-foreground-muted">inline-start</p>
			<InputGroup>
				<InputGroupAddon align="inline-start">
					<AtSignIcon />
				</InputGroupAddon>
				<InputGroupInput placeholder="username" />
			</InputGroup>
			<InputGroup>
				<InputGroupAddon align="inline-start">
					<InputGroupText>https://</InputGroupText>
				</InputGroupAddon>
				<InputGroupInput placeholder="domain.com" />
			</InputGroup>
			<InputGroup>
				<InputGroupAddon align="inline-start">
					<InputGroupButton aria-label="Search">
						<SearchIcon />
					</InputGroupButton>
				</InputGroupAddon>
				<InputGroupInput placeholder="Search..." />
			</InputGroup>
		</div>
	{/snippet}
</Story>

<Story name="Inline End Addons">
	{#snippet template()}
		<div class="flex flex-col gap-3 p-6" style="max-width: 480px">
			<p class="text-xs text-foreground-muted">inline-end</p>
			<InputGroup>
				<InputGroupInput placeholder="Amount" />
				<InputGroupAddon align="inline-end">
					<DollarSignIcon />
				</InputGroupAddon>
			</InputGroup>
			<InputGroup>
				<InputGroupInput placeholder="0.00" />
				<InputGroupAddon align="inline-end">
					<InputGroupText>USD</InputGroupText>
				</InputGroupAddon>
			</InputGroup>
			<InputGroup>
				<InputGroupInput placeholder="Enter text" />
				<InputGroupAddon align="inline-end">
					<InputGroupButton>Submit</InputGroupButton>
				</InputGroupAddon>
			</InputGroup>
		</div>
	{/snippet}
</Story>

<Story name="Block Addons">
	{#snippet template()}
		<div class="flex flex-col gap-4 p-6" style="max-width: 480px">
			<div class="flex flex-col gap-2">
				<p class="text-xs text-foreground-muted">block-start</p>
				<InputGroup>
					<InputGroupAddon align="block-start">
						<InputGroupText>API Key</InputGroupText>
					</InputGroupAddon>
					<InputGroupInput placeholder="sk-..." />
				</InputGroup>
			</div>
			<div class="flex flex-col gap-2">
				<p class="text-xs text-foreground-muted">block-end</p>
				<InputGroup>
					<InputGroupInput placeholder="Enter value" />
					<InputGroupAddon align="block-end">
						<InputGroupText>Required</InputGroupText>
					</InputGroupAddon>
				</InputGroup>
			</div>
			<div class="flex flex-col gap-2">
				<p class="text-xs text-foreground-muted">block-start + block-end</p>
				<InputGroup>
					<InputGroupAddon align="block-start">
						<InputGroupText>Notes</InputGroupText>
					</InputGroupAddon>
					<InputGroupTextarea placeholder="Write something..." rows={3} />
					<InputGroupAddon align="block-end">
						<InputGroupButton>Save</InputGroupButton>
					</InputGroupAddon>
				</InputGroup>
			</div>
		</div>
	{/snippet}
</Story>

<Story name="Button Sizes">
	{#snippet template()}
		<div class="flex flex-col gap-4 p-6" style="max-width: 480px">
			{#each BUTTON_SIZES as size (size)}
				<div class="flex flex-col gap-1">
					<p class="text-xs text-foreground-muted">{size}</p>
					<InputGroup>
						<InputGroupInput placeholder="Value" />
						<InputGroupAddon align="inline-end">
							{#if size === 'xs'}
								<InputGroupButton {size}>Action</InputGroupButton>
							{:else}
								<InputGroupButton {size} aria-label="Action">
									<SendIcon />
								</InputGroupButton>
							{/if}
						</InputGroupAddon>
					</InputGroup>
				</div>
			{/each}
		</div>
	{/snippet}
</Story>

<Story name="With Textarea">
	{#snippet template()}
		<div class="flex flex-col gap-4 p-6" style="max-width: 480px">
			<InputGroup>
				<InputGroupTextarea placeholder="Write your message..." rows={4} />
			</InputGroup>
			<InputGroup>
				<InputGroupAddon align="block-start">
					<InputGroupText>Message</InputGroupText>
				</InputGroupAddon>
				<InputGroupTextarea placeholder="Write your message..." rows={4} />
				<InputGroupAddon align="block-end">
					<InputGroupButton>
						<SendIcon />
						Send
					</InputGroupButton>
				</InputGroupAddon>
			</InputGroup>
		</div>
	{/snippet}
</Story>

<Story name="Addon Aligns Grid">
	{#snippet template()}
		<div class="flex flex-col gap-6 p-6" style="max-width: 500px">
			{#each ADDON_ALIGNS as align (align)}
				<div class="flex flex-col gap-2">
					<p class="text-xs text-foreground-muted">{align}</p>
					<InputGroup>
						{#if align === 'inline-start' || align === 'block-start'}
							<InputGroupAddon {align}>
								<InputGroupText>Label</InputGroupText>
							</InputGroupAddon>
							{#if align === 'block-start'}
								<InputGroupInput placeholder="Value" />
							{:else}
								<InputGroupInput placeholder="Value" />
							{/if}
						{:else}
							<InputGroupInput placeholder="Value" />
							<InputGroupAddon {align}>
								<InputGroupText>Label</InputGroupText>
							</InputGroupAddon>
						{/if}
					</InputGroup>
				</div>
			{/each}
		</div>
	{/snippet}
</Story>
