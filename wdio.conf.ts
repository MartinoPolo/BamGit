import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export const config: WebdriverIO.Config = {
	runner: 'local',
	specs: ['./tests/e2e-tauri/specs/**/*.spec.ts'],
	maxInstances: 1,
	framework: 'mocha',
	reporters: ['spec'],

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
		timeout: 60_000,
	},

	waitforTimeout: 10_000,
};
