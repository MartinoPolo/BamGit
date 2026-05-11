#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'fs/promises';
import { relative } from 'path';

const FIX_MODE = process.argv.includes('--fix');
const VERBOSE = process.argv.includes('--verbose');
const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '');

const RADIUS_MAP = {
	'--radius-none': 'none',
	'--radius-sm': 'sm',
	'--radius-md': 'md',
	'--radius-lg': 'lg',
	'--radius-xl': 'xl',
	'--radius-2xl': '2xl',
	'--radius-3xl': '3xl',
	'--radius-full': 'full',
};
const LEADING_MAP = {
	1: 'none',
	1.25: 'tight',
	1.375: 'snug',
	1.5: 'normal',
	1.625: 'relaxed',
	2: 'loose',
};
const SPATIAL_PREFIXES = new Set([
	'w',
	'h',
	'size',
	'min-w',
	'min-h',
	'max-w',
	'max-h',
	'p',
	'px',
	'py',
	'pt',
	'pr',
	'pb',
	'pl',
	'm',
	'mx',
	'my',
	'mt',
	'mr',
	'mb',
	'ml',
	'gap',
	'gap-x',
	'gap-y',
	'top',
	'right',
	'bottom',
	'left',
	'inset',
	'inset-x',
	'inset-y',
	'basis',
	'grow',
	'shrink',
	'translate-x',
	'translate-y',
	'space-x',
	'space-y',
	'border',
	'border-t',
	'border-r',
	'border-b',
	'border-l',
	'rounded',
	'rounded-t',
	'rounded-r',
	'rounded-b',
	'rounded-l',
	'rounded-tl',
	'rounded-tr',
	'rounded-br',
	'rounded-bl',
]);

function pxToUnit(px) {
	const n = parseInt(px, 10);
	if (isNaN(n) || n <= 0) {
		return null;
	}
	const u = n / 4;
	return Number.isInteger(u) ? String(u) : u.toFixed(2).replace(/\.?0+$/, '');
}

// Anchor: zero-width — at start of string or after whitespace/quote
// Modifier group: handles simple (hover:) and complex (data-[state=x]:) modifiers
const A = String.raw`(?:^|(?<=[\s"']))`;
const M = String.raw`((?:[\w[\]='"\\-]*:)*)`;

function findReplacements(line) {
	const reps = [];
	let m;

	// 1. rounded-[var(--radius-*)] -> rounded-*
	const radiusRe = /\brounded-\[var\((--radius-[^)]+)\)\]/g;
	while ((m = radiusRe.exec(line)) !== null) {
		const s = RADIUS_MAP[m[1]];
		if (s != null) {
			reps.push({ from: m[0], to: s === 'none' ? 'rounded-none' : 'rounded-' + s });
		}
	}

	// 2. {spatial-prefix}-[Npx] -> {prefix}-{N/4}
	const spatialRe = new RegExp(A + M + '(-?)([\\w-]+)-\\[(\\d+)px\\]', 'g');
	while ((m = spatialRe.exec(line)) !== null) {
		const [full, mods, neg, prefix, px] = m;
		const u = pxToUnit(px);
		if (!SPATIAL_PREFIXES.has(prefix)) {
			continue;
		}
		const c = mods + neg + prefix + '-' + u;
		if (c !== full) {
			reps.push({ from: full, to: c });
		}
	}

	// 3. CSS variable shorthand: prop-[var(--name)] -> prop-(--name)
	//    prop-[type:var(--name)] -> prop-(type:--name)
	//    Handles one level of nesting in fallback
	const cssVarRe = new RegExp(
		A +
			M +
			'(-?)([\\w-]+)-\\[(?:([\\w:]+):)?var\\((--[\\w-]+(?:,(?:[^()]*|\\([^()]*\\))*)?)\\)\\]',
		'g',
	);
	while ((m = cssVarRe.exec(line)) !== null) {
		const [full, mods, neg, prefix, typeHint, varContent] = m;
		if (prefix === 'rounded' && varContent.startsWith('--radius-')) {
			continue;
		}
		const inside = typeHint ? typeHint + ':' + varContent : varContent;
		const c = mods + neg + prefix + '-(' + inside + ')';
		if (c !== full) {
			reps.push({ from: full, to: c });
		}
	}

	// 4. duration/delay-[Nms] -> duration/delay-N
	const durRe = new RegExp(A + M + '(duration|delay)-\\[(\\d+)ms\\]', 'g');
	while ((m = durRe.exec(line)) !== null) {
		const [full, mods, prop, n] = m;
		const c = mods + prop + '-' + n;
		if (c !== full) {
			reps.push({ from: full, to: c });
		}
	}

	// 5. z-[N] -> z-N
	const zRe = new RegExp(A + M + 'z-\\[(\\d+)\\]', 'g');
	while ((m = zRe.exec(line)) !== null) {
		const [full, mods, n] = m;
		const c = mods + 'z-' + n;
		if (c !== full) {
			reps.push({ from: full, to: c });
		}
	}

	// 6. leading-[value] -> leading-{named}
	const leadingRe = new RegExp(A + M + 'leading-\\[([\\d.]+)\\]', 'g');
	while ((m = leadingRe.exec(line)) !== null) {
		const [full, mods, val] = m;
		const named = LEADING_MAP[val];
		const c = mods + 'leading-' + named;
		if (c !== full) {
			reps.push({ from: full, to: c });
		}
	}

	return reps;
}

function dedup(reps) {
	const seen = new Set();
	return reps.filter((r) => {
		if (seen.has(r.from)) {
			return false;
		}
		seen.add(r.from);
		return true;
	});
}

let totalFiles = 0,
	totalFindings = 0,
	totalFixed = 0;
const files = [];
for await (const f of glob('src/**/*.{svelte,ts,tsx}', { cwd: ROOT })) {
	files.push(f);
}

for (const relPath of files.sort()) {
	const absPath = ROOT + '/' + relPath;
	const original = readFileSync(absPath, 'utf8');
	const lines = original.split('\n');
	const findings = [];
	for (let i = 0; i < lines.length; i++) {
		for (const r of dedup(findReplacements(lines[i]))) {
			findings.push({ line: i + 1, ...r });
		}
	}
	if (findings.length === 0) {
		continue;
	}
	totalFiles++;
	totalFindings += findings.length;
	const displayPath = relative(ROOT, absPath).replace(/\\/g, '/');
	if (FIX_MODE) {
		let updated = original;
		for (const { from, to } of dedup(findings)) {
			updated = updated.split(from).join(to);
		}
		if (updated !== original) {
			writeFileSync(absPath, updated, 'utf8');
			totalFixed++;
			console.log(
				'\u2714 fixed  ' +
					displayPath +
					'  (' +
					findings.length +
					' replacement' +
					(findings.length > 1 ? 's' : '') +
					')',
			);
			if (VERBOSE) {
				for (const f of findings) {
					console.log('     L' + f.line + '  ' + f.from + '  ->  ' + f.to);
				}
			}
		}
	} else {
		console.log('\n' + displayPath);
		for (const f of findings) {
			console.log('  L' + f.line + '  ' + f.from + '  ->  ' + f.to);
		}
	}
}

console.log('');
if (FIX_MODE) {
	console.log('Done. Fixed ' + totalFixed + ' file(s), ' + totalFindings + ' replacement(s).');
} else if (totalFindings === 0) {
	console.log('No canonical-class issues found.');
} else {
	console.log('Found ' + totalFindings + ' issue(s) in ' + totalFiles + ' file(s).');
	console.log('Run with --fix to apply all replacements automatically.');
}
