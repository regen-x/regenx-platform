import { axiosService } from '@/configs/axios';
import { IOrder, IOrderSummary } from '@/interfaces/api/IOrder';

export const orderService = {
	async getMyOrders(): Promise<IOrder[]> {
		const response = await axiosService.get('/orders/me');
		return (response as any)?.data ?? response ?? [];
	},

	async getMySummary(): Promise<IOrderSummary> {
		const response = await axiosService.get('/orders/me/summary');
		return (response as any)?.data ?? response ?? {};
	},

	async getOrder(id: number | string): Promise<IOrder> {
		const response = await axiosService.get(`/orders/${id}`);
		return (response as any)?.data ?? response ?? {};
	},

	async cancelOrder(id: number | string): Promise<IOrder> {
		const response = await axiosService.post(`/orders/${id}/cancel`);
		return (response as any)?.data ?? response ?? {};
	},
};
