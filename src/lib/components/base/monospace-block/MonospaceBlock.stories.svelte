<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { MonospaceBlock } from './index.js';

	const { Story } = defineMeta({
		title: 'Base/MonospaceBlock',
		component: MonospaceBlock,
		tags: ['autodocs'],
		argTypes: {
			copyButton: {
				control: 'boolean',
			},
			maxHeight: {
				control: 'text',
			},
		},
	});
</script>

<script lang="ts">
	import type { ComponentProps } from 'svelte';

	type MonospaceBlockProps = ComponentProps<typeof MonospaceBlock>;

	const defaultContent = `const greeting = "Hello, world!";
console.log(greeting);
// Output: Hello, world!`;

	const longContent = Array.from(
		{ length: 25 },
		(_, i) =>
			`[${String(i + 1).padStart(2, '0')}] Processing item ${i + 1}: status=ok latency=${Math.round(Math.random() * 100 + 10)}ms`,
	).join('\n');

	const longLineContent =
		'{"type":"error","message":"Unexpected token at position 1472 in module resolution for path \\"node_modules/@types/react/index.d.ts\\"","stack":"TypeError: Cannot read property \'default\' of undefined at resolveModuleExports (/usr/local/lib/node_modules/typescript/lib/typescript.js:45231:42)"}';
</script>

<Story name="Default" args={{ content: defaultContent }}>
	{#snippet template(args: MonospaceBlockProps)}
		<div class="w-[480px]">
			<MonospaceBlock {...args} />
		</div>
	{/snippet}
</Story>

<Story name="WithCopyButton" args={{ content: defaultContent, copyButton: true }}>
	{#snippet template(args: MonospaceBlockProps)}
		<div class="w-[480px]">
			<MonospaceBlock {...args} />
		</div>
	{/snippet}
</Story>

<Story name="WithMaxHeight" args={{ content: longContent, maxHeight: '150px' }}>
	{#snippet template(args: MonospaceBlockProps)}
		<div class="w-[480px]">
			<MonospaceBlock {...args} />
		</div>
	{/snippet}
</Story>

<Story name="LongContent" args={{ content: longLineContent }}>
	{#snippet template(args: MonospaceBlockProps)}
		<div class="w-[480px]">
			<MonospaceBlock {...args} />
		</div>
	{/snippet}
</Story>
