export class MockDesktopOnlyError extends Error {
	constructor(command: string) {
		super(`${command} requires the desktop app`);
		this.name = 'MockDesktopOnlyError';
	}
}
