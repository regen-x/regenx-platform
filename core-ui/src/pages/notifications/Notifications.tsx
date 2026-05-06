import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
	AdminActionButton,
	AdminDataTableShell,
	AdminPageHeader,
} from '@/components/admin-ui';
import {
	formatNotificationTimeAgo,
	getNotificationHref,
} from '@/components/notifications/notification.utils';
import { PATHS } from '@/constants/routes/paths';
import { IAppNotification } from '@/interfaces/api/IAppNotification';
import { appNotificationService } from '@/services/app-notification.service';
import { useUserStore } from '@/store/user.store';

function NotificationRow({
	notification,
	onOpen,
	onMarkRead,
}: {
	notification: IAppNotification;
	onOpen: (notification: IAppNotification) => void;
	onMarkRead: (notification: IAppNotification) => void;
}) {
	return (
		<div
			className={`rounded-[16px] border px-5 py-4 ${
				notification.isRead
					? 'border-[#E7ECF4] bg-white'
					: 'border-[#D5E4F8] bg-[#F7FBFF]'
			}`}
		>
			<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
				<div className="min-w-0">
					<div className="flex flex-wrap items-center gap-2">
						{!notification.isRead ? (
							<span className="h-2.5 w-2.5 rounded-full bg-[#2F80ED]" />
						) : null}
						<div className="text-[16px] font-semibold text-[#163F74]">
							{notification.title}
						</div>
						<div className="rounded-full border border-[#D8E3F2] bg-[#F8FAFD] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#62738D]">
							{notification.type.replace(/_/g, ' ')}
						</div>
					</div>
					<div className="mt-2 text-[14px] leading-[1.6] text-[#5F6C86]">
						{notification.message}
					</div>
					<div className="mt-3 text-[12px] uppercase tracking-[0.08em] text-[#8A9AB3]">
						{formatNotificationTimeAgo(notification.createdAt)}
					</div>
				</div>

				<div className="flex shrink-0 flex-wrap gap-2">
					{!notification.isRead ? (
						<AdminActionButton
							tone="secondary"
							onClick={() => onMarkRead(notification)}
						>
							Mark read
						</AdminActionButton>
					) : null}
					<AdminActionButton onClick={() => onOpen(notification)}>
						Open
					</AdminActionButton>
				</div>
			</div>
		</div>
	);
}

export default function Notifications() {
	const navigate = useNavigate();
	const user = useUserStore((state) => state.user);
	const [loading, setLoading] = useState(true);
	const [notifications, setNotifications] = useState<IAppNotification[]>([]);

	const unreadNotifications = useMemo(
		() => notifications.filter((item) => !item.isRead),
		[notifications],
	);
	const earlierNotifications = useMemo(
		() => notifications.filter((item) => item.isRead),
		[notifications],
	);

	const loadNotifications = async () => {
		setLoading(true);
		try {
			const rows = await appNotificationService.getMyNotifications();
			setNotifications(rows);
		} catch {
			setNotifications([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadNotifications();
	}, []);

	const openNotification = async (notification: IAppNotification) => {
		if (!notification.isRead) {
			try {
				await appNotificationService.markRead(notification.id);
			} catch {
				// Keep navigation responsive even if mark-read fails.
			}
		}

		navigate(getNotificationHref(notification, user?.type));
	};

	const markRead = async (notification: IAppNotification) => {
		try {
			await appNotificationService.markRead(notification.id);
			setNotifications((current) =>
				current.map((item) =>
					item.id === notification.id
						? {
								...item,
								isRead: true,
								readAt: item.readAt ?? new Date().toISOString(),
						  }
						: item,
				),
			);
		} catch {
			return;
		}
	};

	const markAllRead = async () => {
		try {
			await appNotificationService.markAllRead();
			setNotifications((current) =>
				current.map((item) => ({
					...item,
					isRead: true,
					readAt: item.readAt ?? new Date().toISOString(),
				})),
			);
		} catch {
			return;
		}
	};

	return (
		<div className="space-y-5">
			<AdminPageHeader
				eyebrow="Platform Notifications"
				title="Notifications"
				description="Track major order, transaction, distribution, support, and approval activity in one place."
				actions={
					<div className="flex items-center gap-3">
						<AdminActionButton tone="secondary" onClick={markAllRead}>
							Mark all read
						</AdminActionButton>
						<AdminActionButton onClick={() => navigate(`/${PATHS.DASHBOARD}`)}>
							Back to dashboard
						</AdminActionButton>
					</div>
				}
			/>

			<AdminDataTableShell
				title="Unread"
				description="New platform events that still need your attention."
				loading={loading}
				isEmpty={!loading && unreadNotifications.length === 0}
				emptyTitle="You’re all caught up"
				emptyDescription="Unread notifications will appear here when new platform activity occurs."
			>
				<div className="space-y-3">
					{unreadNotifications.map((notification) => (
						<NotificationRow
							key={notification.id}
							notification={notification}
							onOpen={openNotification}
							onMarkRead={markRead}
						/>
					))}
				</div>
			</AdminDataTableShell>

			<AdminDataTableShell
				title="Earlier Notifications"
				description="Previously read platform activity for your account."
				loading={loading}
				isEmpty={!loading && earlierNotifications.length === 0}
				emptyTitle="No earlier notifications"
				emptyDescription="Read notifications will move here after you review them."
			>
				<div className="space-y-3">
					{earlierNotifications.map((notification) => (
						<NotificationRow
							key={notification.id}
							notification={notification}
							onOpen={openNotification}
							onMarkRead={markRead}
						/>
					))}
				</div>
			</AdminDataTableShell>
		</div>
	);
}
