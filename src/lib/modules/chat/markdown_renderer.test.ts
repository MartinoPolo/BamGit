import { describe, it, expect } from 'vitest';
import { renderMarkdown } from './markdown_renderer.js';

describe('renderMarkdown', () => {
	it('returns empty string for empty input', () => {
		expect(renderMarkdown('')).toBe('');
	});

	it('returns empty string for whitespace-only input', () => {
		expect(renderMarkdown('   \n  ')).toBe('');
	});

	it('renders h1-h3 headers', () => {
		const result = renderMarkdown('# Title\n## Subtitle\n### Section');
		expect(result).toContain('<h1');
		expect(result).toContain('Title');
		expect(result).toContain('<h2');
		expect(result).toContain('Subtitle');
		expect(result).toContain('<h3');
		expect(result).toContain('Section');
	});

	it('renders unordered lists', () => {
		const result = renderMarkdown('- item one\n- item two');
		expect(result).toContain('<ul');
		expect(result).toContain('<li');
		expect(result).toContain('item one');
		expect(result).toContain('item two');
	});

	it('renders ordered lists', () => {
		const result = renderMarkdown('1. first\n2. second');
		expect(result).toContain('<ol');
		expect(result).toContain('first');
		expect(result).toContain('second');
	});

	it('renders bold and italic', () => {
		const result = renderMarkdown('**bold** and *italic*');
		expect(result).toContain('<strong>bold</strong>');
		expect(result).toContain('<em>italic</em>');
	});

	it('renders tables', () => {
		const md = '| Col A | Col B |\n|---|---|\n| val1 | val2 |';
		const result = renderMarkdown(md);
		expect(result).toContain('<table');
		expect(result).toContain('<th');
		expect(result).toContain('Col A');
		expect(result).toContain('val1');
	});

	it('renders inline code with <code> tags', () => {
		const result = renderMarkdown('Use `console.log` here');
		expect(result).toContain('<code');
		expect(result).toContain('console.log');
	});

	it('renders links with target="_blank" and rel="noopener"', () => {
		const result = renderMarkdown('[Click](https://example.com)');
		expect(result).toContain('href="https://example.com"');
		expect(result).toContain('target="_blank"');
		expect(result).toContain('rel="noopener noreferrer"');
	});

	it('renders fenced code blocks with language attribute', () => {
		const result = renderMarkdown('```typescript\nconst x = 1;\n```');
		expect(result).toContain('<code');
		expect(result).toContain('const x = 1;');
		expect(result).toContain('data-language="typescript"');
	});

	it('renders code blocks without language', () => {
		const result = renderMarkdown('```\nplain code\n```');
		expect(result).toContain('<code');
		expect(result).toContain('plain code');
	});

	it('sanitizes script tags (XSS prevention)', () => {
		const result = renderMarkdown('<script>alert("xss")</script>');
		expect(result).not.toContain('<script');
	});

	it('sanitizes onerror attributes (XSS prevention)', () => {
		const result = renderMarkdown('<img src=x onerror="alert(1)">');
		expect(result).not.toContain('onerror');
	});

	it('sanitizes javascript: URLs (XSS prevention)', () => {
		const result = renderMarkdown('[click](javascript:alert(1))');
		expect(result).not.toContain('javascript:');
	});

	it('renders strikethrough text', () => {
		const result = renderMarkdown('~~deleted~~');
		expect(result).toContain('<del');
		expect(result).toContain('deleted');
	});

	it('renders paragraphs for plain text', () => {
		const result = renderMarkdown('Hello world');
		expect(result).toContain('<p');
		expect(result).toContain('Hello world');
	});
});
