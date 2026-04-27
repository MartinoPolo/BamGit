import type { NotificationEventType } from '$lib/types/generated';

export function findNotificationDotColor(
	sessionIds: string[],
	getPendingType: (sessionId: string) => NotificationEventType | undefined,
	dotColors: Record<NotificationEventType, string | null>,
): string | null {
	for (const sessionId of sessionIds) {
		const pendingType = getPendingType(sessionId);
		if (pendingType !== undefined) {
			const color = dotColors[pendingType];
			if (color !== null) {
				return color;
			}
		}
	}
	return null;
}
