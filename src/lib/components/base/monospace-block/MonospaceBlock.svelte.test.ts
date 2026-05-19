import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import MonospaceBlock from './MonospaceBlock.svelte';

describe('MonospaceBlock', () => {
	describe('renders content as monospace text', () => {
		it('renders content inside a pre element', async () => {
			const screen = await render(MonospaceBlock, {
				props: { content: 'Hello world' },
			});
			const pre = screen.container.querySelector('pre');
			expect(pre).not.toBeNull();
			expect(pre!.textContent).toBe('Hello world');
		});

		it('has monospace styling classes', async () => {
			const screen = await render(MonospaceBlock, {
				props: { content: 'test' },
			});
			const pre = screen.container.querySelector('pre');
			expect(pre).not.toBeNull();
			expect(pre!.className).toContain('font-mono');
			expect(pre!.className).toContain('text-[11.5px]');
			expect(pre!.className).toContain('whitespace-pre-wrap');
			expect(pre!.className).toContain('leading-relaxed');
		});

		it('has default visual styling classes', async () => {
			const screen = await render(MonospaceBlock, {
				props: { content: 'test' },
			});
			const pre = screen.container.querySelector('pre');
			expect(pre).not.toBeNull();
			expect(pre!.className).toContain('bg-surface-2');
			expect(pre!.className).toContain('border');
			expect(pre!.className).toContain('rounded-md');
			expect(pre!.className).toContain('p-3');
		});
	});

	describe('respects maxHeight prop', () => {
		it('sets max-height and overflow-y auto when maxHeight is provided', async () => {
			const screen = await render(MonospaceBlock, {
				props: { content: 'test', maxHeight: '200px' },
			});
			const pre = screen.container.querySelector('pre');
			expect(pre).not.toBeNull();
			expect(pre!.style.maxHeight).toBe('200px');
			expect(pre!.className).toContain('overflow-y-auto');
		});

		it('does not set max-height when maxHeight is not provided', async () => {
			const screen = await render(MonospaceBlock, {
				props: { content: 'test' },
			});
			const pre = screen.container.querySelector('pre');
			expect(pre).not.toBeNull();
			expect(pre!.style.maxHeight).toBe('');
		});
	});

	describe('copy button behavior', () => {
		let writeTextSpy: ReturnType<typeof vi.spyOn>;

		beforeEach(() => {
			writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
		});

		it('shows copy button when copyButton is true', async () => {
			const screen = await render(MonospaceBlock, {
				props: { content: 'copy me', copyButton: true },
			});
			const button = screen.getByRole('button', { name: /copy/i });
			await expect.element(button).toBeInTheDocument();
		});

		it('does not show copy button when copyButton is false', async () => {
			const screen = await render(MonospaceBlock, {
				props: { content: 'no copy', copyButton: false },
			});
			const button = screen.container.querySelector('button');
			expect(button).toBeNull();
		});

		it('does not show copy button when copyButton is not set', async () => {
			const screen = await render(MonospaceBlock, {
				props: { content: 'no copy' },
			});
			const button = screen.container.querySelector('button');
			expect(button).toBeNull();
		});

		it('copies content to clipboard when copy button is clicked', async () => {
			const screen = await render(MonospaceBlock, {
				props: { content: 'copy this text', copyButton: true },
			});
			const button = screen.getByRole('button', { name: /copy/i });
			await button.click();
			expect(writeTextSpy).toHaveBeenCalledWith('copy this text');
		});
	});

	describe('accepts additional classes via class prop', () => {
		it('merges custom classes with default classes', async () => {
			const screen = await render(MonospaceBlock, {
				props: { content: 'test', class: 'm-0 flex-1' },
			});
			const pre = screen.container.querySelector('pre');
			expect(pre).not.toBeNull();
			expect(pre!.className).toContain('m-0');
			expect(pre!.className).toContain('flex-1');
			// Default classes should still be present
			expect(pre!.className).toContain('font-mono');
		});
	});
});
