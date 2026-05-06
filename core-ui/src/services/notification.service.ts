import { reactToastifyService } from '@/configs/react-toastify';
import { INotificationService } from '@/interfaces/services/INotificationService';

class NotificationService {
	notificationService: INotificationService;
	constructor(notificationService: INotificationService) {
		this.notificationService = notificationService;
	}
	success(msg: string) {
		this.notificationService.success(msg);
	}
	error(msg: string) {
		this.notificationService.error(msg);
	}
}

export const notificationService = new NotificationService(
	reactToastifyService,
);
