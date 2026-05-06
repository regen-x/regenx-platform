type AdminSectionCardProps = {
	title?: string;
	description?: string;
	children: React.ReactNode;
	className?: string;
};

export default function AdminSectionCard({
	title,
	description,
	children,
	className = '',
}: AdminSectionCardProps) {
	return (
		<section
			className={`rounded-[18px] border border-[#E7ECF4] bg-white p-6 shadow-[0_2px_8px_rgba(16,24,40,0.03)] ${className}`}
		>
			{title ? (
				<div className="mb-5">
					<h2 className="text-[20px] font-semibold text-[#163F74]">{title}</h2>
					{description ? (
						<p className="mt-1 text-sm text-[#5F6C86]">{description}</p>
					) : null}
				</div>
			) : null}

			{children}
		</section>
	);
}
