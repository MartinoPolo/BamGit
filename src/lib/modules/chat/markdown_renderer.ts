import { Marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';

const marked = new Marked({
	gfm: true,
	breaks: false,
	renderer: {
		link({ href, text }) {
			return `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
		},
		code({ text, lang }) {
			const langClass = lang != null ? ` class="language-${lang}"` : '';
			const langAttr = lang != null ? ` data-language="${lang}"` : '';
			return `<pre${langAttr}><code${langClass}>${escapeHtml(text)}</code></pre>`;
		},
	},
});

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

export function renderMarkdown(input: string): string {
	if (!input.trim()) {
		return '';
	}

	const raw = marked.parse(input) as string;
	return DOMPurify.sanitize(raw, {
		ADD_ATTR: ['target', 'rel', 'data-language'],
	});
}
