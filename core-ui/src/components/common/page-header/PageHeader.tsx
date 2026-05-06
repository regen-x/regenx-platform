type PageHeaderProps = {
	eyebrow?: string;
	title: string;
	description?: string;
	actions?: React.ReactNode;
};

export default function PageHeader({
	eyebrow,
	title,
	description,
	actions,
}: PageHeaderProps) {
	return (
		<div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
			<div>
				{eyebrow ? (
					<div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
						{eyebrow}
					</div>
				) : null}

				<h1 className="mt-2 text-5xl font-semibold tracking-tight text-slate-900">
					{title}
				</h1>

				{description ? (
					<p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
						{description}
					</p>
				) : null}
			</div>

			{actions ? <div className="shrink-0">{actions}</div> : null}
		</div>
	);
}
