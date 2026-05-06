type AdminDataFieldProps = {
	label: string;
	value?: React.ReactNode;
	full?: boolean;
};

export default function AdminDataField({
	label,
	value,
	full = false,
}: AdminDataFieldProps) {
	return (
		<div
			className={`flex flex-col rounded-[16px] border border-[#E6ECF5] bg-[#F8FAFC] px-4 py-3 ${
				full ? 'md:col-span-2' : ''
			}`}
		>
			<div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#98A2B3] mb-1">
				{label}
			</div>

			<div className="text-[14px] font-semibold leading-[1.4] text-[#101828]">
				{value === undefined || value === null || value === '' ? '—' : value}
			</div>
		</div>
	);
}
