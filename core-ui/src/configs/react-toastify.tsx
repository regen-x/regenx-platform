import { toast } from 'react-toastify';

import { IToastService } from '@/interfaces/services/IToastService';

export function success(message: string) {
	toast.success(message, {
		position: 'bottom-right',
	});
}
export function error(message: string) {
	toast.error(message, {
		position: 'bottom-right',
	});
}
export const reactToastifyService: IToastService = { success, error };
