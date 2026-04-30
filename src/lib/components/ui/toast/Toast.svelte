<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { toastVariants, toastIconColors, type ToastProps } from './toast-variants.js';
	import XIcon from '@lucide/svelte/icons/x';

	let {
		ref = $bindable<HTMLDivElement | null>(null),
		class: className,
		tone = 'info',
		title,
		body,
		icon,
		action,
		onDismiss,
		...restProps
	}: ToastProps = $props();
</script>

<div
	bind:this={ref}
	data-slot="toast"
	data-tone={tone}
	role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'}
	aria-live={tone === 'danger' || tone === 'warning' ? 'assertive' : 'polite'}
	class={cn(toastVariants({ tone }), className)}
	{...restProps}
>
	{#if icon}
		<div class={cn('shrink-0', toastIconColors[tone])}>
			{@render icon()}
		</div>
	{/if}

	<div class="min-w-0 flex-1">
		<div class="text-[12.5px] font-semibold text-foreground">{title}</div>
		{#if body}
			<div class="mt-0.5 text-[length:var(--text-sm)] text-foreground-muted">{body}</div>
		{/if}
	</div>

	{#if action}
		{@render action()}
	{/if}

	{#if onDismiss}
		<button
			type="button"
			onclick={onDismiss}
			aria-label="Dismiss"
			class="shrink-0 inline-flex size-6 items-center justify-center rounded-md text-foreground-subtle transition-colors hover:bg-surface-2 hover:text-foreground"
		>
			<XIcon class="size-3" />
		</button>
	{/if}
</div>
