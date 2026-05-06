import { axiosService } from '@/configs/axios';
import { ISupportTicket } from '@/interfaces/api/ISupportTicket';

export const supportService = {
	async createTicket(payload: {
		category: string;
		subject: string;
		description: string;
		priority?: string;
		attachment?: File | null;
	}): Promise<ISupportTicket> {
		const formData = new FormData();
		formData.append('category', payload.category);
		formData.append('subject', payload.subject);
		formData.append('description', payload.description);
		if (payload.priority) {
			formData.append('priority', payload.priority);
		}
		if (payload.attachment) {
			formData.append('attachment', payload.attachment);
		}

		const response = await axiosService.post('/support/tickets', formData, {});
		return (response as any)?.data ?? response ?? {};
	},

	async getMyTickets(): Promise<ISupportTicket[]> {
		const response = await axiosService.get('/support/tickets/me');
		return (response as any)?.data ?? response ?? [];
	},

	async getTicket(id: number | string): Promise<ISupportTicket> {
		const response = await axiosService.get(`/support/tickets/${id}`);
		return (response as any)?.data ?? response ?? {};
	},

	async getAdminTickets(): Promise<ISupportTicket[]> {
		const response = await axiosService.get('/support/tickets/admin');
		return (response as any)?.data ?? response ?? [];
	},

	async updateStatus(
		id: number | string,
		status: string,
	): Promise<ISupportTicket> {
		const response = await axiosService.patch(`/support/tickets/${id}/status`, {
			status,
		});
		return (response as any)?.data ?? response ?? {};
	},

	async assignTicket(
		id: number | string,
		assignedToUserId?: number | null,
	): Promise<ISupportTicket> {
		const response = await axiosService.patch(`/support/tickets/${id}/assign`, {
			assignedToUserId,
		});
		return (response as any)?.data ?? response ?? {};
	},

	async updateAdminNote(
		id: number | string,
		adminNotes?: string | null,
	): Promise<ISupportTicket> {
		const response = await axiosService.patch(
			`/support/tickets/${id}/admin-note`,
			{
				adminNotes,
			},
		);
		return (response as any)?.data ?? response ?? {};
	},
};
