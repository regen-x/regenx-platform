import { PATHS } from '@/constants/routes/paths';
import { IAppNotification } from '@/interfaces/api/IAppNotification';

export function formatNotificationTimeAgo(value?: string | null) {
	if (!value) return 'Just now';

	const date = new Date(value);
	const diffMs = date.getTime() - Date.now();
	const diffMinutes = Math.round(diffMs / (1000 * 60));
	const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

	const thresholds: Array<[Intl.RelativeTimeFormatUnit, number]> = [
		['year', 60 * 24 * 365],
		['month', 60 * 24 * 30],
		['week', 60 * 24 * 7],
		['day', 60 * 24],
		['hour', 60],
		['minute', 1],
	];

	for (const [unit, divisor] of thresholds) {
		if (Math.abs(diffMinutes) >= divisor || unit === 'minute') {
			return rtf.format(Math.round(diffMinutes / divisor), unit);
		}
	}

	return 'Just now';
}

export function getNotificationHref(
	notification: IAppNotification,
	role?: string | null,
) {
	switch (notification.relatedEntityType) {
		case 'order':
			return `/${PATHS.ORDERS}`;
		case 'transaction':
			return role === 'admin'
				? '/admin/transactions'
				: `/${PATHS.TRANSACTIONS}`;
		case 'distribution':
			return `/${PATHS.DISTRIBUTIONS}`;
		case 'offer':
			return `/${PATHS.OFFERS}`;
		case 'support_ticket':
			return role === 'admin' ? '/admin/support' : `/${PATHS.SUPPORT}`;
		case 'project':
			return notification.relatedEntityId
				? `/project/${notification.relatedEntityId}`
				: `/${PATHS.PROJECTS}`;
		case 'account_verification':
			return `/${PATHS.ACCOUNT_VERIFICATION}`;
		case 'developer_profile':
			return `/${PATHS.DEVELOPER_SETUP}`;
		default:
			return `/${PATHS.NOTIFICATIONS}`;
	}
}
