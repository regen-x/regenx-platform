type AppPageHeaderProps = {
	eyebrow: string;
	title: string;
	description?: string;
};

export default function AppPageHeader({
	eyebrow,
	title,
	description,
}: AppPageHeaderProps) {
	return (
		<div className="border-b border-[#E7ECF4] pb-4">
			<div className="inline-flex items-center rounded-[8px] bg-[#DDEBFF] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#346FB6]">
				{eyebrow}
			</div>
			<h1 className="mt-2 text-[30px] font-semibold text-[#16588F]">{title}</h1>
			{description ? (
				<p className="mt-1 max-w-[720px] text-[14px] text-[#5F6C86]">
					{description}
				</p>
			) : null}
		</div>
	);
}
