import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

function killStaleTauriProcesses(): void {
	try {
		execSync(
			'powershell -NoProfile -Command "Get-Process -Name grovekeeper,msedgedriver,tauri-driver -ErrorAction SilentlyContinue | Stop-Process -Force -Confirm:$false"',
			{ stdio: 'ignore' },
		);
	} catch {
		// no processes to kill
	}
}

export const config: WebdriverIO.Config = {
	runner: 'local',
	specs: ['./tests/e2e-tauri/specs/**/*.spec.ts'],
	maxInstances: 1,
	framework: 'mocha',
	reporters: ['spec'],
	logLevel: 'error',

	services: [
		[
			'@wdio/tauri-service',
			{
				driverProvider: 'official',
				autoDownloadEdgeDriver: true,
			},
		],
	],

	capabilities: [
		{
			browserName: 'tauri',
			'tauri:options': {
				application: path.resolve(__dirname, 'src-tauri/target/debug/grovekeeper.exe'),
			},
		},
	],

	baseUrl: 'http://tauri.localhost',
	specFileRetries: 1,

	mochaOpts: {
		ui: 'bdd',
		timeout: 300_000,
	},

	waitforTimeout: 10_000,

	onPrepare() {
		killStaleTauriProcesses();
	},

	async before() {
		const { browser } = await import('@wdio/globals');

		// String scripts bypass esbuild's __name transform that breaks in the browser.

		// Bridge window.wdioTauri → Rust tauri-plugin-wdio via Tauri invoke.
		// Satisfies @wdio/tauri-service cache (prevents 5s poll per command).
		await browser.execute(
			'var t = window.__TAURI__, inv = t && t.core && t.core.invoke;' +
				'window.wdioTauri = {' +
				'execute: function(c,a){return inv ? inv("plugin:wdio|"+c, a||{}) : Promise.resolve(null)},' +
				'waitForInit: function(){return Promise.resolve()}' +
				'};',
		);

		// Minimize window so E2E tests don't steal focus
		await browser.execute(
			'var t = window.__TAURI__;' +
				'if(t && t.window && t.window.getCurrentWindow){' +
				't.window.getCurrentWindow().minimize()' +
				'}',
		);
	},

	onComplete() {
		killStaleTauriProcesses();
	},
};
