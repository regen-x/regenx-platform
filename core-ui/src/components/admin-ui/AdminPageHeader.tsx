import AppPageHeader from '@/components/layout/AppPageHeader';
import NotificationBell from '@/components/notifications/NotificationBell';
import ThemeToggle from '@/components/ui/ThemeToggle';

type AdminPageHeaderProps = {
	eyebrow?: string;
	title: string;
	description?: string;
	actions?: React.ReactNode;
};

export default function AdminPageHeader({
	eyebrow,
	title,
	description,
	actions,
}: AdminPageHeaderProps) {
	return (
		<div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
			<div className="min-w-0 flex-1">
				<AppPageHeader
					eyebrow={eyebrow || 'RegenX'}
					title={title}
					description={description}
				/>
			</div>

			<div className="flex shrink-0 items-center gap-3">
				{actions ? <div>{actions}</div> : null}
				<NotificationBell />
				<ThemeToggle />
			</div>
		</div>
	);
}
