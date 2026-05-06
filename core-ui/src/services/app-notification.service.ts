import { axiosService } from '@/configs/axios';
import {
	IAppNotification,
	IUnreadNotificationCount,
} from '@/interfaces/api/IAppNotification';

export const appNotificationService = {
	async getMyNotifications(): Promise<IAppNotification[]> {
		const response = await axiosService.get('/notifications/me');
		return (response as any)?.data ?? response ?? [];
	},

	async getUnreadCount(): Promise<IUnreadNotificationCount> {
		const response = await axiosService.get('/notifications/me/unread-count');
		return (response as any)?.data ?? response ?? { unreadCount: 0 };
	},

	async markRead(id: number | string): Promise<IAppNotification> {
		const response = await axiosService.patch(`/notifications/${id}/read`);
		return (response as any)?.data ?? response ?? {};
	},

	async markAllRead(): Promise<{ updatedCount: number }> {
		const response = await axiosService.patch('/notifications/read-all');
		return (response as any)?.data ?? response ?? { updatedCount: 0 };
	},
};
