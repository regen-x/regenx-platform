export type AppNotificationType =
	| 'ORDER_CREATED'
	| 'ORDER_SUBMITTED'
	| 'ORDER_SETTLING'
	| 'ORDER_COMPLETED'
	| 'ORDER_FAILED'
	| 'TRANSACTION_COMPLETED'
	| 'DISTRIBUTION_PAID'
	| 'SELL_ORDER_CREATED'
	| 'SELL_ORDER_FILLED'
	| 'SELL_ORDER_CANCELLED'
	| 'ACCOUNT_APPROVED'
	| 'PROJECT_APPROVED'
	| 'SUPPORT_TICKET_UPDATED'
	| 'SYSTEM_ALERT';

export interface IAppNotification {
	id: number;
	uuid?: string;
	userId: number;
	type: AppNotificationType;
	title: string;
	message: string;
	relatedEntityType?: string | null;
	relatedEntityId?: number | null;
	isRead: boolean;
	createdAt: string;
	readAt?: string | null;
}

export interface IUnreadNotificationCount {
	unreadCount: number;
}
