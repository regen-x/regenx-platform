type PageHeaderProps = {
	label?: string;
	title: string;
	description?: string;
	className?: string;
};

export default function PageHeader({
	label,
	title,
	description,
	className = '',
}: PageHeaderProps) {
	return (
		<div className={`mb-8 ${className}`}>
			{label ? (
				<div className="inline-flex rounded-full bg-[#E8EEF9] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#1D4ED8]">
					{label}
				</div>
			) : null}

			<h1 className="mt-5 text-4xl font-semibold tracking-tight text-[#185C9A]">
				{title}
			</h1>

			{description ? (
				<p className="mt-3 max-w-4xl text-sm text-[#667085]">{description}</p>
			) : null}

			<div className="mt-5 border-b border-slate-200" />
		</div>
	);
}
