import AdminEmptyState from './AdminEmptyState';
import AdminSectionCard from './AdminSectionCard';

type AdminDataTableShellProps = {
	title: string;
	description?: string;
	filters?: React.ReactNode;
	loading?: boolean;
	loadingLabel?: string;
	isEmpty?: boolean;
	emptyTitle?: string;
	emptyDescription?: string;
	emptyActionLabel?: string;
	onEmptyAction?: () => void;
	children: React.ReactNode;
	className?: string;
};

export default function AdminDataTableShell({
	title,
	description,
	filters,
	loading = false,
	loadingLabel = 'Loading data...',
	isEmpty = false,
	emptyTitle = 'No records available',
	emptyDescription = 'Records will appear here when data becomes available.',
	emptyActionLabel,
	onEmptyAction,
	children,
	className = '',
}: AdminDataTableShellProps) {
	return (
		<AdminSectionCard
			title={title}
			description={description}
			className={className}
		>
			{filters}

			{loading ? (
				<div className="rounded-[18px] border theme-border bg-[color-mix(in_srgb,var(--bg-card)_85%,transparent)] px-6 py-8 text-sm theme-text-secondary">
					{loadingLabel}
				</div>
			) : isEmpty ? (
				<AdminEmptyState
					title={emptyTitle}
					description={emptyDescription}
					actionLabel={emptyActionLabel}
					onAction={onEmptyAction}
				/>
			) : (
				<div className="overflow-x-auto">{children}</div>
			)}
		</AdminSectionCard>
	);
}
