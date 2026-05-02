import type { RawRequirementNote } from './types.js';

const TIMESTAMP_HEADER_REGEX = /^## (\d{4}-\d{2}-\d{2} \d{2}:\d{2})( \[processed\])?$/;
const SECTION_DELIMITER = '---';

export function parseRawRequirements(markdown: string): RawRequirementNote[] {
	if (markdown.trim() === '') {
		return [];
	}

	const sections = markdown.split(`\n${SECTION_DELIMITER}\n`);
	const notes: RawRequirementNote[] = [];

	for (const section of sections) {
		const lines = section.split('\n');
		const headerLine = lines[0];
		const headerMatch = TIMESTAMP_HEADER_REGEX.exec(headerLine);

		if (!headerMatch) {
			continue;
		}

		const timestamp = headerMatch[1];
		const processed = headerMatch[2] !== undefined;
		const contentLines = lines.slice(1);
		const content = contentLines.join('\n').replace(/\n$/, '');

		if (content.length === 0) {
			continue;
		}

		notes.push({ timestamp, content, processed });
	}

	return notes;
}

export function serializeRawRequirements(notes: readonly RawRequirementNote[]): string {
	if (notes.length === 0) {
		return '';
	}

	return notes
		.map((note) => {
			const processedMarker = note.processed ? ' [processed]' : '';
			return `## ${note.timestamp}${processedMarker}\n${note.content}\n`;
		})
		.join(`${SECTION_DELIMITER}\n`);
}

export function formatTimestamp(date?: Date): string {
	const targetDate = date ?? new Date();

	const year = targetDate.getFullYear();
	const month = String(targetDate.getMonth() + 1).padStart(2, '0');
	const day = String(targetDate.getDate()).padStart(2, '0');
	const hours = String(targetDate.getHours()).padStart(2, '0');
	const minutes = String(targetDate.getMinutes()).padStart(2, '0');

	return `${year}-${month}-${day} ${hours}:${minutes}`;
}
