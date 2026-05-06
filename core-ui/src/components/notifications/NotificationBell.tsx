import { Bell } from 'lucide-react';
import {
	MouseEvent as ReactMouseEvent,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import { useNavigate } from 'react-router-dom';

import {
	formatNotificationTimeAgo,
	getNotificationHref,
} from './notification.utils';

import { PATHS } from '@/constants/routes/paths';
import { IAppNotification } from '@/interfaces/api/IAppNotification';
import { appNotificationService } from '@/services/app-notification.service';
import { useUserStore } from '@/store/user.store';

type NotificationBellProps = {
	buttonClassName?: string;
	panelClassName?: string;
};

export default function NotificationBell({
	buttonClassName = '',
	panelClassName = '',
}: NotificationBellProps) {
	const navigate = useNavigate();
	const user = useUserStore((state) => state.user);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [unreadCount, setUnreadCount] = useState(0);
	const [notifications, setNotifications] = useState<IAppNotification[]>([]);

	const visibleNotifications = useMemo(
		() => notifications.slice(0, 6),
		[notifications],
	);

	const loadUnreadCount = async () => {
		try {
			const summary = await appNotificationService.getUnreadCount();
			setUnreadCount(Number(summary?.unreadCount ?? 0));
		} catch {
			setUnreadCount(0);
		}
	};

	const loadNotifications = async () => {
		setLoading(true);
		try {
			const rows = await appNotificationService.getMyNotifications();
			setNotifications(rows);
			setUnreadCount(rows.filter((row) => !row.isRead).length);
		} catch {
			setNotifications([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadUnreadCount();

		const intervalId = window.setInterval(() => {
			loadUnreadCount();
		}, 45000);

		return () => window.clearInterval(intervalId);
	}, []);

	useEffect(() => {
		if (!open) return;

		const onMouseDown = (event: globalThis.MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setOpen(false);
			}
		};

		document.addEventListener('mousedown', onMouseDown);
		return () => document.removeEventListener('mousedown', onMouseDown);
	}, [open]);

	const handleToggle = async () => {
		const nextOpen = !open;
		setOpen(nextOpen);

		if (nextOpen) {
			await loadNotifications();
		}
	};

	const handleMarkRead = async (
		event: ReactMouseEvent,
		notificationId: number,
	) => {
		event.stopPropagation();

		try {
			await appNotificationService.markRead(notificationId);
			setNotifications((current) =>
				current.map((item) =>
					item.id === notificationId
						? {
								...item,
								isRead: true,
								readAt: item.readAt ?? new Date().toISOString(),
						  }
						: item,
				),
			);
			setUnreadCount((current) => Math.max(current - 1, 0));
		} catch {
			return;
		}
	};

	const handleMarkAllRead = async () => {
		try {
			await appNotificationService.markAllRead();
			setNotifications((current) =>
				current.map((item) => ({
					...item,
					isRead: true,
					readAt: item.readAt ?? new Date().toISOString(),
				})),
			);
			setUnreadCount(0);
		} catch {
			return;
		}
	};

	const handleOpenNotification = async (notification: IAppNotification) => {
		if (!notification.isRead) {
			try {
				await appNotificationService.markRead(notification.id);
				setUnreadCount((current) => Math.max(current - 1, 0));
			} catch {
				// Keep navigation responsive even if mark-read fails.
			}
		}

		setOpen(false);
		navigate(getNotificationHref(notification, user?.type));
	};

	return (
		<div ref={containerRef} className="relative">
			<button
				type="button"
				onClick={handleToggle}
				className={`theme-icon-button relative flex h-[46px] w-[46px] items-center justify-center rounded-[12px] border ${buttonClassName}`}
				aria-label="Open notifications"
			>
				<Bell className="h-4 w-4" />
				{unreadCount > 0 ? (
					<span className="absolute right-2 top-2 inline-flex min-w-[18px] items-center justify-center rounded-full bg-[#2F80ED] px-1.5 py-[1px] text-[10px] font-semibold text-white">
						{unreadCount > 9 ? '9+' : unreadCount}
					</span>
				) : null}
			</button>

			{open ? (
				<div
					className={`absolute right-0 top-[56px] z-[140] w-[360px] rounded-[18px] border border-[#E7ECF4] bg-white p-4 shadow-[0_20px_50px_rgba(15,23,42,0.16)] ${panelClassName}`}
				>
					<div className="flex items-center justify-between gap-3">
						<div>
							<div className="text-[16px] font-semibold text-[#163F74]">
								Notifications
							</div>
							<div className="mt-1 text-[12px] text-[#66748E]">
								Latest platform activity across your account
							</div>
						</div>

						<button
							type="button"
							onClick={handleMarkAllRead}
							className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#2F5EA8]"
						>
							Mark all read
						</button>
					</div>

					<div className="mt-4 space-y-2">
						{loading ? (
							<div className="rounded-[14px] border border-dashed border-[#D8E3F2] bg-[#FAFBFD] px-4 py-6 text-center text-[13px] text-[#66748E]">
								Loading notifications...
							</div>
						) : visibleNotifications.length > 0 ? (
							visibleNotifications.map((notification) => (
								<button
									key={notification.id}
									type="button"
									onClick={() => handleOpenNotification(notification)}
									className={`w-full rounded-[14px] border px-4 py-3 text-left transition ${
										notification.isRead
											? 'border-[#E7ECF4] bg-white'
											: 'border-[#CFE0F7] bg-[#F6FAFF]'
									}`}
								>
									<div className="flex items-start justify-between gap-3">
										<div className="min-w-0">
											<div className="flex items-center gap-2">
												{!notification.isRead ? (
													<span className="h-2 w-2 rounded-full bg-[#2F80ED]" />
												) : null}
												<div className="truncate text-[13px] font-semibold text-[#173F73]">
													{notification.title}
												</div>
											</div>
											<div className="mt-1 text-[13px] leading-[1.5] text-[#5F6C86]">
												{notification.message}
											</div>
											<div className="mt-2 text-[11px] uppercase tracking-[0.08em] text-[#8A9AB3]">
												{formatNotificationTimeAgo(notification.createdAt)}
											</div>
										</div>

										{!notification.isRead ? (
											<span
												onClick={(event) =>
													handleMarkRead(event, notification.id)
												}
												className="shrink-0 cursor-pointer text-[11px] font-semibold uppercase tracking-[0.08em] text-[#2F5EA8]"
											>
												Read
											</span>
										) : null}
									</div>
								</button>
							))
						) : (
							<div className="rounded-[14px] border border-dashed border-[#D8E3F2] bg-[#FAFBFD] px-4 py-6 text-center text-[13px] text-[#66748E]">
								No notifications yet. New account activity will appear here.
							</div>
						)}
					</div>

					<button
						type="button"
						onClick={() => {
							setOpen(false);
							navigate(`/${PATHS.NOTIFICATIONS}`);
						}}
						className="mt-4 w-full rounded-[12px] border border-[#D8E3F2] px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#1E4E9C]"
					>
						View all notifications
					</button>
				</div>
			) : null}
		</div>
	);
}
