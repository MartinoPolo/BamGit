declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		interface PageState {
			activeIssueId?: string | null;
			activeTab?: string | null;
		}
		// interface Platform {}
	}
}

export {};
