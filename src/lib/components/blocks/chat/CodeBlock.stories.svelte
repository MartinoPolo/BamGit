<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import CodeBlock from './CodeBlock.svelte';

	const { Story } = defineMeta({
		title: 'Blocks/Chat/CodeBlock',
		component: CodeBlock,
		tags: ['autodocs'],
	});
</script>

<script lang="ts">
	const typescriptSnippet = `export interface Provider {
  spawn(): Promise<Session>;
  sendMessage(msg: string): Promise<void>;
  handleToolResult(id: string, result: unknown): Promise<void>;
}`;

	const rustMultiline = `use anyhow::Result;
use rusqlite::Connection;
use std::path::PathBuf;

pub struct Database {
    connection: Connection,
    path: PathBuf,
}

impl Database {
    pub fn open(path: impl Into<PathBuf>) -> Result<Self> {
        let path = path.into();
        let connection = Connection::open(&path)?;
        connection.execute_batch("
            PRAGMA journal_mode = WAL;
            PRAGMA synchronous = NORMAL;
            PRAGMA foreign_keys = ON;
        ")?;
        Ok(Self { connection, path })
    }

    pub fn execute(&self, sql: &str) -> Result<usize> {
        Ok(self.connection.execute(sql, [])?)
    }

    pub fn query_row<T, F>(&self, sql: &str, f: F) -> Result<T>
    where
        F: FnOnce(&rusqlite::Row<'_>) -> rusqlite::Result<T>,
    {
        Ok(self.connection.query_row(sql, [], f)?)
    }
}`;

	const noLanguageCode = `Some plain text output without any language specified.
It could be log output, a configuration snippet, or anything else.
Line 3 of the output.`;

	const longSingleLine =
		'const veryLongVariableName = performSomeComplexCalculation(firstArgument, secondArgument, thirdArgument, fourthArgument, fifthArgument, sixthArgument, seventhArgument, eighthArgument);';
</script>

<Story name="Short Snippet">
	{#snippet template()}
		<div class="mx-auto max-w-225">
			<CodeBlock language="typescript" code={typescriptSnippet} />
		</div>
	{/snippet}
</Story>

<Story name="Long Multiline">
	{#snippet template()}
		<div class="mx-auto max-w-225">
			<CodeBlock language="rust" code={rustMultiline} />
		</div>
	{/snippet}
</Story>

<Story name="No Language">
	{#snippet template()}
		<div class="mx-auto max-w-225">
			<CodeBlock code={noLanguageCode} />
		</div>
	{/snippet}
</Story>

<Story name="Long Single Line">
	{#snippet template()}
		<div class="mx-auto max-w-225">
			<CodeBlock language="javascript" code={longSingleLine} />
		</div>
	{/snippet}
</Story>

<Story name="Copy Button">
	{#snippet template()}
		<div class="mx-auto max-w-225">
			<p class="mb-2 text-xs text-foreground-muted">
				Click the copy button in the header to copy code to clipboard.
			</p>
			<CodeBlock language="bash" code="npm install @tauri-apps/api@latest" />
		</div>
	{/snippet}
</Story>
