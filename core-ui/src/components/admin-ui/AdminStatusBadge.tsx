type Tone = 'yellow' | 'pink' | 'blue' | 'gray';

interface Props {
	label: string;
	tone?: Tone;
}

const toneStyles: Record<Tone, string> = {
	yellow: 'bg-[#FFF7DB] text-[#8A6A00] border-[#E7CC72]',
	pink: 'bg-[#FFF1F3] text-[#C01048] border-[#F3C2CF]',
	blue: 'bg-[#EEF4FF] text-[#3157D6] border-[#C9D7FF]',
	gray: 'bg-[#F8FAFC] text-[#475467] border-[#D0D5DD]',
};

export default function AdminStatusBadge({ label, tone = 'gray' }: Props) {
	const formatted = label
		.replaceAll('_', ' ')
		.replace(/\b\w/g, (c) => c.toUpperCase());

	return (
		<span
			className={`inline-flex items-center whitespace-nowrap rounded-full border px-3 py-1.5 text-[13px] font-semibold leading-none ${toneStyles[tone]}`}
		>
			{formatted}
		</span>
	);
}
