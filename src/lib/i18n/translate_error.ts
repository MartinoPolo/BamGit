import * as m from '$lib/paraglide/messages.js';

const ERROR_KEY_MAP: Record<string, () => string> = {
	ERR_PALETTE_BUILTIN: () => m.err_palette_builtin(),
	ERR_PALETTE_BUILTIN_DELETE: () => m.err_palette_builtin_delete(),
	ERR_PALETTE_NOT_FOUND: () => m.err_palette_not_found(),
	ERR_PALETTE_EMPTY: () => m.err_palette_empty(),
	ERR_DASHBOARD_NOT_FOUND: () => m.err_dashboard_not_found(),
	ERR_ISSUE_NOT_FOUND: () => m.err_issue_not_found(),
	ERR_ACTION_NOT_FOUND: () => m.err_action_not_found(),
	ERR_NO_SOUND_FILE: () => m.err_no_sound_file(),
	ERR_NOTIFICATION_SERVICE_UNAVAILABLE: () => m.err_notification_service_unavailable(),
	ERR_GIT_BASH_NOT_FOUND: () => m.err_git_bash_not_found(),
	ERR_SCRIPTS_NOT_FOUND: () => m.err_scripts_not_found(),
};

export function translateErrorKey(errorKey: string): string {
	if (errorKey.startsWith('ERR_PALETTE_IN_USE:')) {
		const count = errorKey.split(':')[1] ?? '0';
		return m.err_palette_in_use({ count });
	}

	const translator = ERROR_KEY_MAP[errorKey];
	if (translator !== undefined) {
		return translator();
	}

	return errorKey;
}
