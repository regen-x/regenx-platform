import AdminActionButton from './AdminActionButton';

type AdminEmptyStateProps = {
	title: string;
	description: string;
	actionLabel?: string;
	onAction?: () => void;
	className?: string;
};

export default function AdminEmptyState({
	title,
	description,
	actionLabel,
	onAction,
	className = '',
}: AdminEmptyStateProps) {
	return (
		<div
			className={`rounded-[18px] border border-dashed theme-border bg-[color-mix(in_srgb,var(--bg-card)_82%,transparent)] px-6 py-10 text-center ${className}`}
		>
			<div className="theme-heading text-[18px] font-semibold">{title}</div>
			<div className="mx-auto mt-2 max-w-[560px] text-sm leading-[1.55] theme-text-secondary">
				{description}
			</div>
			{actionLabel && onAction ? (
				<div className="mt-5">
					<AdminActionButton onClick={onAction} tone="primary">
						{actionLabel}
					</AdminActionButton>
				</div>
			) : null}
		</div>
	);
}
