declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		interface PageState {
			activeIssueId?: string | null;
			activeTab?: string | null;
			usagePeriod?: string | null;
			usageScope?: string | null;
			usageGroupBy?: string | null;
			usageCustomFrom?: string | null;
			usageCustomTo?: string | null;
		}
		// interface Platform {}
	}
}

export {};
