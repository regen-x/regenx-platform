type AdminStatCardProps = {
	label: string;
	value: React.ReactNode;
	helper?: string;
	tone?: 'blue' | 'pink' | 'yellow' | 'neutral';
};

const toneClasses = {
	blue: 'border-[#DCE7F5] bg-[#F8FBFF]',
	pink: 'border-[#F0D9E5] bg-[#FFF8FB]',
	yellow: 'border-[#F3E6B8] bg-[#FFFBEF]',
	neutral: 'border-[#E7ECF4] bg-white',
};

export default function AdminStatCard({
	label,
	value,
	helper,
	tone = 'neutral',
}: AdminStatCardProps) {
	return (
		<div
			className={`rounded-[18px] border px-5 py-4 shadow-[0_2px_8px_rgba(16,24,40,0.03)] ${toneClasses[tone]}`}
		>
			<div className="text-[13px] font-semibold text-[#2C4775]">{label}</div>
			<div className="mt-2 text-[21px] font-semibold leading-none text-[#1263A7]">
				{value}
			</div>
			{helper ? (
				<div className="mt-2 text-[13px] leading-[1.4] text-[#5D6B84]">
					{helper}
				</div>
			) : null}
		</div>
	);
}
