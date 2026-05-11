import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import ColorPicker from './ColorPicker.svelte';
import { DEFAULT_COLOR_PALETTE } from './color_utils.js';

describe('ColorPicker', () => {
	it('trigger renders with correct background color', async () => {
		const selectedColor = '#e53e3e';
		const screen = await render(ColorPicker, {
			props: { selectedColor, onSelect: () => {} },
		});

		const trigger = screen.getByRole('button', { name: `Color: ${selectedColor}` });
		await expect.element(trigger).toBeVisible();
		await expect.element(trigger).toHaveClass('h-7 w-7');
		await expect.element(trigger).toHaveStyle({ backgroundColor: 'rgb(229, 62, 62)' });
	});

	it('clicking trigger opens popover', async () => {
		const screen = await render(ColorPicker, {
			props: { selectedColor: '#e53e3e', onSelect: () => {} },
		});

		const trigger = screen.getByRole('button', { name: 'Color: #e53e3e' });
		await trigger.click();

		// Popover content should now be visible with preset swatches
		const swatches = page.getByRole('button', { name: /^#[0-9a-f]{6}$/i });
		await expect.element(swatches.first()).toBeVisible();
	});

	it('clicking preset swatch calls onSelect and closes popover', async () => {
		const onSelect = vi.fn();
		const screen = await render(ColorPicker, {
			props: { selectedColor: '#e53e3e', onSelect },
		});

		const trigger = screen.getByRole('button', { name: 'Color: #e53e3e' });
		await trigger.click();

		// Click a different color swatch
		const targetColor = DEFAULT_COLOR_PALETTE[3]; // '#38a169'
		const swatch = page.getByRole('button', { name: targetColor });
		await swatch.click();

		expect(onSelect).toHaveBeenCalledWith(targetColor);

		// Popover should close - trigger should still be visible but swatches gone
		await expect.element(swatch).not.toBeInTheDocument();
	});

	it('hex input does NOT close popover on input', async () => {
		const onSelect = vi.fn();
		const screen = await render(ColorPicker, {
			props: { selectedColor: '#e53e3e', onSelect },
		});

		const trigger = screen.getByRole('button', { name: 'Color: #e53e3e' });
		await trigger.click();

		const hexInput = page.getByPlaceholder('#000000');
		await hexInput.fill('#00ff00');

		// Popover should still be open - swatches still visible
		const swatches = page.getByRole('button', { name: /^#[0-9a-f]{6}$/i });
		await expect.element(swatches.first()).toBeVisible();
	});

	it('empty selectedColor falls back to first palette color', async () => {
		const screen = await render(ColorPicker, {
			props: { selectedColor: '', onSelect: () => {} },
		});

		const firstColor = DEFAULT_COLOR_PALETTE[0];
		const trigger = screen.getByRole('button', { name: `Color: ${firstColor}` });
		await expect.element(trigger).toBeVisible();
		await expect.element(trigger).toHaveStyle({ backgroundColor: 'rgb(229, 62, 62)' });
	});

	it('usedColors disables matching swatches', async () => {
		const usedColor = DEFAULT_COLOR_PALETTE[2]; // '#d69e2e'
		const screen = await render(ColorPicker, {
			props: {
				selectedColor: '#e53e3e',
				onSelect: () => {},
				usedColors: [usedColor],
			},
		});

		const trigger = screen.getByRole('button', { name: 'Color: #e53e3e' });
		await trigger.click();

		const usedSwatch = page.getByRole('button', { name: usedColor });
		await expect.element(usedSwatch).toBeDisabled();
	});

	it('usedColors does NOT disable the currently-selected color', async () => {
		const selectedColor = '#e53e3e';
		const screen = await render(ColorPicker, {
			props: {
				selectedColor,
				onSelect: () => {},
				usedColors: [selectedColor],
			},
		});

		const trigger = screen.getByRole('button', { name: `Color: ${selectedColor}` });
		await trigger.click();

		const selectedSwatch = page.getByRole('button', { name: selectedColor, exact: true });
		await expect.element(selectedSwatch).not.toBeDisabled();
	});

	it('displayText appears on swatches when provided', async () => {
		const screen = await render(ColorPicker, {
			props: { selectedColor: '#e53e3e', onSelect: () => {}, displayText: 'A' },
		});

		const trigger = screen.getByRole('button', { name: 'Color: #e53e3e' });
		await trigger.click();

		// Swatches should contain the text "A"
		const swatchWithText = page.getByText('A').first();
		await expect.element(swatchWithText).toBeVisible();
	});

	it('no text rendered when displayText omitted', async () => {
		const screen = await render(ColorPicker, {
			props: { selectedColor: '#e53e3e', onSelect: () => {} },
		});

		const trigger = screen.getByRole('button', { name: 'Color: #e53e3e' });
		await trigger.click();

		// No "A" text should appear inside swatches
		const textElements = page.getByText('A');
		await expect.element(textElements.first()).not.toBeInTheDocument();
	});

	it('aria-label reflects current color', async () => {
		const selectedColor = '#38a169';
		const screen = await render(ColorPicker, {
			props: { selectedColor, onSelect: () => {} },
		});

		const trigger = screen.getByRole('button', { name: `Color: ${selectedColor}` });
		await expect.element(trigger).toBeVisible();
		await expect.element(trigger).toHaveAttribute('aria-label', `Color: ${selectedColor}`);
	});
});
