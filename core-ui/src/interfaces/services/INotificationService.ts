export interface INotificationService {
	success: (msg: string) => void;
	error: (msg: string) => void;
}
